/**
 * POST /content-creator/api/daily/draft — สร้าง daily-7 draft + gen 7 คำทำนาย (sync) [S6c]
 * body: { requestKey, targetDate? }  (ไม่ส่ง targetDate → วันนี้กรุงเทพ, freeze ครั้งแรก)
 * idempotent: requestKey เดิ่ม → คืน draft เดิม (ไม่ gen ซ้ำ) ; payload ต่าง → 409
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { createDaily7Draft, bangkokTodayISO, draftErrorStatus } from "@/content-creator/daily7-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  requestKey: z.string().min(1),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี requestKey)" }, { status: 400 });
  }
  const targetDate = body.targetDate ?? bangkokTodayISO();
  try {
    const draft = await createDaily7Draft(getContentDb(), body.requestKey, targetDate);
    return NextResponse.json({ ok: draft.status !== "FAILED", draft }, { status: 200 });
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
