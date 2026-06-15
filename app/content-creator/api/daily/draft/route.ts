/**
 * POST /content-creator/api/daily/draft — สร้าง daily-7 draft + gen 7 คำทำนาย (sync) [S6c]
 * body: { requestKey, targetDate }  — targetDate **client-frozen** (บังคับส่ง):
 *   ห้าม server derive today (retry เดิมข้ามเที่ยงคืน → payload ต่าง → 409 ไม่ idempotent) [ตู๋ P1.1]
 * idempotent: requestKey เดิ่ม + payload ตรง → คืน draft เดิม (ไม่ gen ซ้ำ) ; payload ต่าง → 409
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { createDaily7Draft, draftErrorStatus } from "@/content-creator/daily7-service";
import { isValidIsoDate } from "@/content-creator/templates/daily7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  requestKey: z.string().min(1),
  // calendar-valid + client-frozen — ไม่ใช่แค่ \d{4}-\d{2}-\d{2} (กัน 2026-99-99 จ่าย Gemini) [ตู๋ P1.3]
  targetDate: z.string().refine(isValidIsoDate, "targetDate ต้องเป็นวันปฏิทินจริง YYYY-MM-DD"),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี requestKey + targetDate วันจริง)" }, { status: 400 });
  }
  try {
    const draft = await createDaily7Draft(getContentDb(), body.requestKey, body.targetDate);
    return NextResponse.json({ ok: draft.status !== "FAILED", draft }, { status: 200 });
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
