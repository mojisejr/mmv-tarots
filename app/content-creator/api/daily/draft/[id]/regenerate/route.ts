/**
 * POST /content-creator/api/daily/draft/:id/regenerate — gen 7 คำทำนายใหม่ทั้งชุด [S6c]
 * body: { attemptKey, expectedRevision } — attemptKey ใหม่ = จงใจ regen ; ซ้ำ = replay (ไม่ gen ซ้ำ)
 * กัน stale regen ทับ user edits ด้วย token+revision (ดู db/drafts)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { regenDaily7Draft, draftErrorStatus } from "@/content-creator/daily7-service";
import { draftRouteResponse } from "@/content-creator/lib/draft-route-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ attemptKey: z.string().min(1), expectedRevision: z.number().int().min(0) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี attemptKey + expectedRevision)" }, { status: 400 });
  }
  try {
    const draft = await regenDaily7Draft(getContentDb(), id, body.attemptKey, body.expectedRevision);
    return draftRouteResponse(draft);
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
