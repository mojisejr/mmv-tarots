/**
 * content-creator generate engine [S2] — row PENDING → gen caption+ภาพ → GENERATED
 *
 * production-readiness:
 *  - claim PENDING→GENERATING (atomic) ก่อนเรียก Gemini = กัน concurrent gen ซ้ำ/เปลือง cost
 *  - gen ล้ม → releaseGenerate(FAILED) (recovery)
 *  - ภาพเก็บเป็น file (CONTENT_MEDIA_DIR) + imagePath ใน DB (รูปไม่ยัดใน sqlite)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { contentPosts } from "./db/schema";
import { claimForGenerate, markGenerated, releaseGenerate } from "./db/transition";
import { genCaption, genImage } from "./lib/gemini";
import { getTemplate } from "./templates";

const mediaDir = () => process.env.CONTENT_MEDIA_DIR || "content-creator/media";

export interface GenerateResult {
  ok: boolean;
  status: "GENERATED" | "FAILED" | "SKIPPED";
  caption?: string;
  imagePath?: string;
  error?: string;
}

/**
 * gen content ของ post 1 ตัว (PENDING → GENERATING → GENERATED/FAILED).
 * SKIPPED = claim ไม่ได้ (ไม่ใช่ PENDING / worker อื่น claim ไปแล้ว) — ปลอดภัยเรียกซ้ำ
 */
export async function generate(db: ContentDb, id: string): Promise<GenerateResult> {
  // claim ก่อนเรียก Gemini (external + cost) — worker เดียวเท่านั้น
  if (!claimForGenerate(db, id)) {
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

    markGenerated(db, id, caption, imagePath);
    return { ok: true, status: "GENERATED", caption, imagePath };
  } catch (err) {
    releaseGenerate(db, id, "FAILED"); // ปล่อย claim → FAILED (retry → PENDING ได้)
    return { ok: false, status: "FAILED", error: err instanceof Error ? err.message : String(err) };
  }
}

function persistImage(id: string, bytes: Uint8Array): string {
  const dir = mediaDir();
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.png`);
  writeFileSync(path, new Uint8Array(bytes)); // wrap → BlobPart-safe / fs ok
  return path;
}
