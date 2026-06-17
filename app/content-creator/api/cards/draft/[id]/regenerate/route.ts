/**
 * POST /content-creator/api/cards/draft/:id/regenerate — สุ่มไพ่ใหม่ทั้งชุด + ตีความใหม่ [PR#103]
 * body: { attemptKey, expectedRevision } — replay (attemptKey เดิม) → ไม่ gen ซ้ำ ; revision ไม่ตรง → 409
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { regenRandomCardsDraft } from "@/content-creator/random-cards-service";
import { draftErrorStatus } from "@/content-creator/daily7-service";

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
    const draft = await regenRandomCardsDraft(getContentDb(), id, body.attemptKey, body.expectedRevision);
    return NextResponse.json({ ok: draft.status !== "FAILED", draft }, { status: 200 });
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
