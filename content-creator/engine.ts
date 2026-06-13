/**
 * content-creator generate engine [S2] — row PENDING → gen caption+ภาพ → GENERATED
 *
 * production-readiness:
 *  - claim PENDING→GENERATING (atomic) ก่อนเรียก Gemini = กัน concurrent gen ซ้ำ/เปลือง cost
 *  - gen ล้ม → releaseGenerate(FAILED) (recovery)
 *  - ภาพเก็บเป็น file (CONTENT_MEDIA_DIR) + imagePath ใน DB (รูปไม่ยัดใน sqlite)
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
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
  // เขียนไฟล์ลง path ผูกกับ token (immutable ต่อ attempt) — attempt อื่นเขียนคนละไฟล์ ทับกันไม่ได้
  let attemptPath: string | undefined;
  try {
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, id)).get();
    if (!row) throw new Error(`content post not found: ${id}`);

    const template = getTemplate(row.templateId);
    template.inputSchema.parse(row.inputData); // validate (throw → FAILED)

    const { system, prompt } = template.buildCaptionPrompt(row.inputData);
    const caption = await genCaption({ system, prompt });
    const bytes = await genImage({ prompt: template.buildImagePrompt(row.inputData) });
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
