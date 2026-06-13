/**
 * content-creator generate engine [S2] — row PENDING → gen caption+ภาพ → GENERATED
 *
 * production-readiness:
 *  - claim PENDING→GENERATING (atomic) ก่อนเรียก Gemini = กัน concurrent gen ซ้ำ/เปลือง cost
 *  - gen ล้ม → releaseGenerate(FAILED) (recovery)
 *  - ภาพเก็บเป็น file (CONTENT_MEDIA_DIR) + imagePath ใน DB (รูปไม่ยัดใน sqlite)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { eq } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { contentPosts } from "./db/schema";
import { claimForGenerate, markGenerated, releaseGenerate } from "./db/transition";
import { genCaption, genImage } from "./lib/gemini";
import { getTemplate } from "./templates";

const mediaDir = () => process.env.CONTENT_MEDIA_DIR || "content-creator/media";

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
  try {
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, id)).get();
    if (!row) throw new Error(`content post not found: ${id}`);

    const template = getTemplate(row.templateId);
    template.inputSchema.parse(row.inputData); // validate (throw → FAILED)

    const { system, prompt } = template.buildCaptionPrompt(row.inputData);
    const caption = await genCaption({ system, prompt });
    const bytes = await genImage({ prompt: template.buildImagePrompt(row.inputData) });
    const imagePath = persistImage(id, bytes);

    // completion เฉพาะถ้า token ยังตรง (กัน stale worker ทับ attempt ที่ reclaim ไปแล้ว)
    if (!markGenerated(db, id, token, caption, imagePath)) {
      return { ok: false, status: "SUPERSEDED" };
    }
    return { ok: true, status: "GENERATED", caption, imagePath };
  } catch (err) {
    releaseGenerate(db, id, token); // WHERE token ตรง — ไม่ทับ attempt ใหม่ถ้าโดน reclaim
    return { ok: false, status: "FAILED", error: err instanceof Error ? err.message : String(err) };
  }
}

/** เก็บภาพเป็น file — sanitize id + assert path ไม่หลุดออกนอก media root (กัน path traversal) [P2] */
function persistImage(id: string, bytes: Uint8Array): string {
  const dir = mediaDir();
  mkdirSync(dir, { recursive: true });
  const safeName = id.replace(/[^A-Za-z0-9_-]/g, "_"); // ../ → _ (กัน escape)
  const path = join(dir, `${safeName}.png`);
  const root = resolve(dir);
  if (!resolve(path).startsWith(root + sep)) {
    throw new Error(`unsafe media path derived from id: ${id}`);
  }
  writeFileSync(path, new Uint8Array(bytes));
  return path;
}
