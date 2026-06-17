/**
 * content-creator generate engine [S2] — row PENDING → gen caption+ภาพ → GENERATED
 *
 * production-readiness:
 *  - claim PENDING→GENERATING (atomic) ก่อนเรียก Gemini = กัน concurrent gen ซ้ำ/เปลือง cost
 *  - gen ล้ม → releaseGenerate(FAILED) (recovery)
 *  - ภาพเก็บเป็น file (CONTENT_MEDIA_DIR) + imagePath ใน DB (รูปไม่ยัดใน sqlite)
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { contentPosts, type BrandProfile } from "./db/schema";
import { getBrandProfile } from "./db/brand";
import { claimForGenerate, markGenerated, releaseGenerate } from "./db/transition";
import { genCaption, genImage, genImageWithRef } from "./lib/gemini";
import { buildCaptionRequest, validateCaption, normalizeBrandTerms } from "./lib/caption";
import { safeResolveUnderRoot } from "./lib/safe-path";
import { getTemplate } from "./templates";
import type { CaptionPrompt } from "./templates/types";

/**
 * caption ที่ "เคยโพสต์จริง" (POSTED) N อันล่าสุด — feed เข้า prompt กันเขียนซ้ำของที่ public เห็นแล้ว
 * [S5 anti-repeat]. ใช้ POSTED + order postedAt (ไม่ใช่ทุก status/updatedAt — กัน draft/canceled/
 * transition เก่าเบียดของจริง) [ตู๋ P2]. ช่วงแรกไม่มี POSTED → ว่าง (ยังไม่มีอะไรให้ซ้ำ)
 */
export function getRecentCaptions(db: ContentDb, excludeId: string, limit = 5): string[] {
  return db
    .select({ caption: contentPosts.caption })
    .from(contentPosts)
    .where(and(eq(contentPosts.status, "POSTED"), isNotNull(contentPosts.caption), ne(contentPosts.id, excludeId)))
    .orderBy(desc(contentPosts.postedAt))
    .limit(limit)
    .all()
    .map((r) => r.caption)
    .filter((c): c is string => !!c);
}

/** gen caption + validate (length/CTA) ; ไม่ผ่าน → regen 1 ครั้ง (เข้มขึ้น) ; ยังไม่ผ่าน → throw (FAILED) [S5] */
async function generateCaption(base: CaptionPrompt, brand: BrandProfile, recentCaptions: string[]): Promise<string> {
  const reqq = buildCaptionRequest({ base, brand, recentCaptions });
  // normalizeBrandTerms = guard ชื่อแบรนด์ (พี่หมี่→พี่มี่) เสมอ แม้ model สะกดผิด [brand consistency]
  let caption = normalizeBrandTerms((await genCaption(reqq)).trim());
  let v = validateCaption(caption, brand);
  if (!v.ok) {
    // regen 1 ครั้ง พร้อม feedback ว่าทำไมไม่ผ่าน (caption gen ถูก — ยอม regen ได้)
    const retry: CaptionPrompt = { system: `${reqq.system}\n\n(รอบก่อนไม่ผ่านกติกา: ${v.reason} — แก้ให้ถูกเป๊ะ)`, prompt: reqq.prompt };
    caption = normalizeBrandTerms((await genCaption(retry)).trim());
    v = validateCaption(caption, brand);
    if (!v.ok) throw new Error(`caption ไม่ผ่านกติกาหลัง regen: ${v.reason}`);
  }
  return caption;
}

const mediaDir = () => process.env.CONTENT_MEDIA_DIR || "content-creator/media";

/** สั่ง model ไม่ใส่ text บนภาพ (caveat spike: nano banana สะกดมั่ว — caption ใส่ตอนโพสต์ FB แยก) */
const NO_TEXT_DIRECTIVE =
  "สำคัญ: ห้ามมีตัวอักษร ข้อความ ชื่อ หรือลายน้ำใด ๆ บนภาพ (no text, letters, captions, or watermark in the image).";

/**
 * directive นำหน้า ref-based gen — บังคับให้ "ยึดตัวละคร+สไตล์จาก ref" (ไม่ใช่ใช้ ref เป็นแค่ style cue).
 * ขาดบรรทัดนี้ = model สร้างตัวละครใหม่ตาม theme prompt (เคยได้ฟีนิกซ์แทนแมว). theme เป็น "ฉาก/props" รอง.
 */
const refDirective = (theme: string) =>
  "ใช้ตัวละครหลักและสไตล์ศิลป์จาก 'ภาพอ้างอิงที่แนบมา' ให้เหมือนเป๊ะ — " +
  "หน้าตา ชนิดสัตว์ สีสัน เครื่องแต่งกาย และรายละเอียดของตัวละครต้องตรงกับภาพอ้างอิงทุกประการ (เป็นตัวละครเดียวกัน). " +
  `สร้างภาพใหม่โดยเปลี่ยนเฉพาะ ฉาก/props/ท่าทาง/องค์ประกอบ ให้สื่อถึงธีมต่อไปนี้: ${theme}`;

/**
 * อ่าน brand reference image แบบ path-safe (admin-set ใน DB — เชื่อไม่ได้) [ตู๋ P1].
 * ใช้ safeResolveUnderRoot (util เดียวกับ media route + publish) — กัน traversal + symlink escape.
 */
function loadBrandRef(refImagePath: string): Uint8Array {
  if (!refImagePath.endsWith(".png")) throw new Error(`brand ref ต้องเป็น .png: ${refImagePath}`);
  const real = safeResolveUnderRoot(process.cwd(), refImagePath);
  if (!real) throw new Error(`brand ref ไม่พบ/ไม่ปลอดภัย: ${refImagePath}`);
  return new Uint8Array(readFileSync(real));
}

export interface GenerateResult {
  ok: boolean;
  status: "GENERATED" | "FAILED" | "SKIPPED" | "SUPERSEDED";
  caption?: string;
  imagePath?: string;
  error?: string;
}

/**
 * gen content ของ post 1 ตัว (PENDING → GENERATING → GENERATED/FAILED).
 * SKIPPED = claim ไม่ได้ (ไม่ใช่ PENDING) · SUPERSEDED = ระหว่าง gen โดน reclaim (token ไม่ตรง) → ไม่ทับ attempt ใหม่
 */
export async function generate(db: ContentDb, id: string): Promise<GenerateResult> {
  // claim ก่อนเรียก Gemini (external + cost) — ได้ ownership token (worker เดียว)
  const token = claimForGenerate(db, id);
  if (!token) {
    return { ok: false, status: "SKIPPED" };
  }
  // เขียนไฟล์ลง path ผูกกับ token (immutable ต่อ attempt) — attempt อื่นเขียนคนละไฟล์ ทับกันไม่ได้
  let attemptPath: string | undefined;
  try {
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, id)).get();
    if (!row) throw new Error(`content post not found: ${id}`);

    const template = getTemplate(row.templateId);
    const parsed = template.inputSchema.parse(row.inputData); // validate + canonical (throw → FAILED)

    // brand profile (หมอมี่) steer ทุก gen ให้ theme เดียวกัน [S3.5b/c]
    const brand = getBrandProfile(db);

    // CTA mandatory [S5/ตู๋]: ทุกโพสต์ต้องมี CTA link (ทั้ง ai + composition) → เช็คก่อน paid caption
    if (!brand.ctaUrl.trim()) {
      throw new Error("CTA บังคับ: ต้องตั้ง CTA link (ctaUrl) ใน Settings ก่อน gen (ทุกโพสต์ต้องมี CTA)");
    }

    const recentCaptions = getRecentCaptions(db, id);
    let caption: string;
    let bytes: Uint8Array;

    if (template.imageStrategy === "composition") {
      // composition [S6a]: template render ภาพเอง (narrow → renderImage บังคับมี) — **ไม่แตะ brand ref / Gemini image**.
      // render "ก่อน" paid caption (local + fail-fast: font/bg หาย → ไม่จ่าย caption ฟรี) [ตู๋ ordering]
      // seed = post id (immutable) → bg selection deterministic: retry/reclaim/preview ได้ใบเดิม [S6b]
      bytes = await template.renderImage(parsed, { brand, seed: id });
      caption = await generateCaption(template.buildCaptionPrompt(parsed), brand, recentCaptions);
    } else if (template.imageStrategy === "ai") {
      // ai [finance]: narrow → buildImagePrompt บังคับมี ; preflight ref ก่อน paid → caption → Gemini image (เดิม)
      const refImage = brand.refImagePath ? loadBrandRef(brand.refImagePath) : null;
      caption = await generateCaption(template.buildCaptionPrompt(parsed), brand, recentCaptions);
      const basePrompt = template.buildImagePrompt(parsed);
      const themeWithStyle = brand.stylePrompt ? `${basePrompt}\n\nสไตล์ภาพ: ${brand.stylePrompt}` : basePrompt;
      bytes = refImage
        ? await genImageWithRef({
            prompt: `${refDirective(themeWithStyle)}\n\n${NO_TEXT_DIRECTIVE}`,
            refImage,
            model: brand.imageModel ?? undefined,
          })
        : await genImage({ prompt: themeWithStyle });
    } else {
      // hybrid [random-cards PR#103]: caption → AI scene (ref แมว, NO text/cards) → renderComposite วางไพ่จริง+ข้อความ
      // explicit pipeline [ตู๋ P1]: ไพ่ถูก draw+persist ใน inputData ตั้งแต่ draft (ก่อน paid) → renderComposite อ่าน cardIds เดิม
      const refImage = brand.refImagePath ? loadBrandRef(brand.refImagePath) : null;
      if (!refImage) throw new Error("hybrid template ต้องมี brand ref image (ตั้ง refImagePath ใน Settings ก่อน gen)");
      caption = await generateCaption(template.buildCaptionPrompt(parsed), brand, recentCaptions);
      const basePrompt = template.buildImagePrompt(parsed); // ฉาก AI (no text/cards)
      const themeWithStyle = brand.stylePrompt ? `${basePrompt}\n\nสไตล์ภาพ: ${brand.stylePrompt}` : basePrompt;
      // AI scene fail → throw → FAILED (ไม่มี composition fallback — final ขึ้นกับ brand visual) [ตู๋ P1]
      const scene = await genImageWithRef({
        prompt: `${refDirective(themeWithStyle)}\n\n${NO_TEXT_DIRECTIVE}`,
        refImage,
        model: brand.imageModel ?? undefined,
      });
      // scene = in-memory (ไม่เขียน temp → ไม่มี temp artifact ต้อง cleanup) ; final image คือ artifact เดียว (cleanup ใน catch)
      // compose fail หลัง paid scene → throw → catch ลบ final artifact ที่ persist (ถ้ามี) [ตู๋ P1]
      bytes = await template.renderComposite(parsed, { brand, seed: id }, scene);
    }
    attemptPath = persistImage(id, token, bytes); // fence เดิม (token-scoped) ครอบทั้ง 2 path

    // commit DB เฉพาะถ้า token ยังตรง. ไม่ตรง = โดน reclaim → ลบ artifact ของ attempt เรา (ไม่แตะ winner)
    if (!markGenerated(db, id, token, caption, attemptPath)) {
      cleanupArtifact(attemptPath);
      return { ok: false, status: "SUPERSEDED" };
    }
    return { ok: true, status: "GENERATED", caption, imagePath: attemptPath };
  } catch (err) {
    if (attemptPath) cleanupArtifact(attemptPath); // ลบไฟล์ที่เพิ่งเขียน (ถ้ามี) ก่อนปล่อย claim
    // ปล่อย claim เฉพาะถ้า token ยังเป็นเจ้าของ ; ไม่ใช่ = โดน reclaim → SUPERSEDED (ไม่ใช่ FAILED)
    if (!releaseGenerate(db, id, token)) {
      return { ok: false, status: "SUPERSEDED" };
    }
    return { ok: false, status: "FAILED", error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * เก็บภาพเป็น file ที่ path ผูกกับ token (1 attempt = 1 ไฟล์, immutable) — กัน stale worker overwrite ไฟล์ winner.
 * sanitize id+token + assert path ไม่หลุดออกนอก media root (กัน path traversal) [ตู๋ P1/P2]
 */
function persistImage(id: string, token: string, bytes: Uint8Array): string {
  const dir = mediaDir();
  mkdirSync(dir, { recursive: true });
  const safeName = `${id}-${token}`.replace(/[^A-Za-z0-9_-]/g, "_"); // ../ → _ (กัน escape) ; token → unique ต่อ attempt
  const path = join(dir, `${safeName}.png`);
  const root = resolve(dir);
  if (!resolve(path).startsWith(root + sep)) {
    throw new Error(`unsafe media path derived from id: ${id}`);
  }
  writeFileSync(path, new Uint8Array(bytes));
  return path;
}

/**
 * ลบ artifact ของ attempt ที่แพ้ (token ไม่ owns แล้ว) — best-effort จริง: swallow error
 * ห้ามให้ rmSync (permission/EBUSY) throw แล้วข้าม releaseGenerate → ค้าง GENERATING [ตู๋ nit].
 * stale file ที่ลบไม่ได้ค้างไว้ไม่อันตราย (ไม่ถูก reference ใน DB) — แค่ log ไว้ให้รู้
 */
function cleanupArtifact(path: string): void {
  try {
    rmSync(path, { force: true });
  } catch (err) {
    console.warn(`content-creator: cleanup stale artifact failed (${path}):`, err instanceof Error ? err.message : err);
  }
}
