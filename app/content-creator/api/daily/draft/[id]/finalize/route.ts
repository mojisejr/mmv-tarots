/**
 * POST /content-creator/api/daily/draft/:id/finalize — snapshot → สร้าง contentPost (PENDING) [S6c]
 * body: { finalizeKey, expectedRevision, backgroundId }
 * validate FinalInput strict (7 วัน canonical) + backgroundId อยู่ใน manifest ; atomic กัน double-finalize
 * → คืน contentPostId (ฟีมไปต่อที่ gen ภาพ/approve queue)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { finalizeDaily7Draft, draftErrorStatus } from "@/content-creator/daily7-service";

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
  try {
    const res = finalizeDaily7Draft(getContentDb(), id, body.finalizeKey, body.expectedRevision, body.backgroundId);
    return NextResponse.json({ ok: true, contentPostId: res.contentPostId, idempotent: res.replay }, { status: 200 });
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
