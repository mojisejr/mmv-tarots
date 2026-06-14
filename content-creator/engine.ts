/**
 * content-creator generate engine [S2] — row PENDING → gen caption+ภาพ → GENERATED
 *
 * production-readiness:
 *  - claim PENDING→GENERATING (atomic) ก่อนเรียก Gemini = กัน concurrent gen ซ้ำ/เปลือง cost
 *  - gen ล้ม → releaseGenerate(FAILED) (recovery)
 *  - ภาพเก็บเป็น file (CONTENT_MEDIA_DIR) + imagePath ใน DB (รูปไม่ยัดใน sqlite)
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { eq } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { contentPosts } from "./db/schema";
import { getBrandProfile } from "./db/brand";
import { claimForGenerate, markGenerated, releaseGenerate } from "./db/transition";
import { genCaption, genImage, genImageWithRef } from "./lib/gemini";
import { getTemplate } from "./templates";

const mediaDir = () => process.env.CONTENT_MEDIA_DIR || "content-creator/media";

/** สั่ง model ไม่ใส่ text บนภาพ (caveat spike: nano banana สะกดมั่ว — caption ใส่ตอนโพสต์ FB แยก) */
const NO_TEXT_DIRECTIVE =
  "สำคัญ: ห้ามมีตัวอักษร ข้อความ ชื่อ หรือลายน้ำใด ๆ บนภาพ (no text, letters, captions, or watermark in the image).";

/**
 * อ่าน brand reference image แบบ path-safe (admin-set ใน DB — เชื่อไม่ได้) [ตู๋ P1].
 * lexical resolve อย่างเดียวไม่พอ — symlink ใน path ชี้ออกนอก repo ได้ → local bytes หลุดไป Gemini.
 * ใช้ realpath + reject symlink (แนวเดียวกับ media route S3).
 */
function loadBrandRef(refImagePath: string): Uint8Array {
  if (!refImagePath.endsWith(".png")) throw new Error(`brand ref ต้องเป็น .png: ${refImagePath}`);
  const root = realpathSync(resolve(process.cwd())); // realpath root (กัน symlink ใน path เช่น /tmp→/private/tmp)
  const candidate = resolve(root, refImagePath);
  if (!existsSync(candidate)) throw new Error(`brand ref ไม่พบ: ${refImagePath}`);
  if (lstatSync(candidate).isSymbolicLink()) throw new Error(`brand ref เป็น symlink (ไม่อนุญาต): ${refImagePath}`);
  const real = realpathSync(candidate);
  if (real !== candidate || !real.startsWith(root + sep)) {
    throw new Error(`brand ref path ไม่ปลอดภัย (หลุดนอก repo): ${refImagePath}`);
  }
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
    template.inputSchema.parse(row.inputData); // validate (throw → FAILED)

    // brand profile (หมอมี่) steer ทุก gen ให้ theme เดียวกัน [S3.5b/c]
    const brand = getBrandProfile(db);

    // preflight: ถ้าใช้ ref → อ่าน+validate ref "ก่อน" Gemini call ใด ๆ
    // (ref ไม่พบ/ไม่ปลอดภัย → FAILED ทันที ไม่จ่าย genCaption ฟรี) [ตู๋ P1]
    const refImage = brand.refImagePath ? loadBrandRef(brand.refImagePath) : null;

    const { system, prompt } = template.buildCaptionPrompt(row.inputData);
    const captionSystem = brand.captionPersona ? `${system}\n\n[persona] ${brand.captionPersona}` : system;
    const caption = await genCaption({ system: captionSystem, prompt });

    const basePrompt = template.buildImagePrompt(row.inputData);
    const styledPrompt = brand.stylePrompt ? `${basePrompt}\n\nสไตล์ภาพ: ${brand.stylePrompt}` : basePrompt;
    // มี ref → nano banana (fix ตัวละคร/style) + ห้าม text บนภาพ ; ไม่มี ref → text-to-image เดิม
    const bytes = refImage
      ? await genImageWithRef({
          prompt: `${styledPrompt}\n\n${NO_TEXT_DIRECTIVE}`,
          refImage,
          model: brand.imageModel ?? undefined,
        })
      : await genImage({ prompt: styledPrompt });
    attemptPath = persistImage(id, token, bytes);

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
