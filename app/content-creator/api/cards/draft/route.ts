/**
 * POST /content-creator/api/cards/draft — สร้าง random-cards draft + จั่ว 3 ใบ + ตีความ (sync) [PR#103]
 * body: { requestKey } — idempotent: requestKey เดิม → draft เดิม (ไพ่/ตีความเดิม ไม่ gen ซ้ำ)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { createRandomCardsDraft } from "@/content-creator/random-cards-service";
import { draftErrorStatus } from "@/content-creator/daily7-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ requestKey: z.string().min(1) });

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี requestKey)" }, { status: 400 });
  }
  try {
    const draft = await createRandomCardsDraft(getContentDb(), body.requestKey);
    return NextResponse.json({ ok: draft.status !== "FAILED", draft }, { status: 200 });
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
