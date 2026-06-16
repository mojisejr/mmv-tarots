/**
 * POST /content-creator/api/daily/draft/:id/finalize — snapshot → สร้าง contentPost → generate [S6c.2]
 * body: { finalizeKey, expectedRevision, backgroundId }
 * 1) finalize: validate FinalInput strict + backgroundId ใน manifest → สร้าง contentPost (PENDING, atomic)
 * 2) generate: gen ภาพ composition + caption → GENERATED → โผล่คิว approve (ปิด loop เหมือน finance)
 *    (generate บังคับ CTA url — ไม่ตั้ง → FAILED + error ชัด). replay → generate SKIP ถ้า gen ไปแล้ว
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { eq } from "drizzle-orm";
import { finalizeDaily7Draft, draftErrorStatus, classifyFinalizeStatus } from "@/content-creator/daily7-service";
import { generate } from "@/content-creator/engine";
import { contentPosts } from "@/content-creator/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  finalizeKey: z.string().min(1),
  expectedRevision: z.number().int().min(0),
  backgroundId: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี finalizeKey + expectedRevision + backgroundId)" }, { status: 400 });
  }

  const db = getContentDb();
  let contentPostId: string;
  try {
    contentPostId = finalizeDaily7Draft(db, id, body.finalizeKey, body.expectedRevision, body.backgroundId).contentPostId;
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }

  // gen ต่อ (sync) → ปิด loop ถึงคิว approve. ผลสะท้อนใน post row → classify ตาม status จริง [ตู๋ P1]
  // (ห้ามเหมา SKIPPED=success — replay หลัง response หายอาจเป็น GENERATING/FAILED)
  const gen = await generate(db, contentPostId);
  const post = db.select().from(contentPosts).where(eq(contentPosts.id, contentPostId)).get();
  const status = post?.status ?? "PENDING";
  const c = classifyFinalizeStatus(status);
  return NextResponse.json(
    { ok: c.ok, definitive: c.definitive, contentPostId, status, caption: post?.caption ?? gen.caption, error: gen.error },
    { status: c.http },
  );
}
