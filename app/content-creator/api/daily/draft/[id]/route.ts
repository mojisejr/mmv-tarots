/**
 * PATCH /content-creator/api/daily/draft/:id — แก้คำทำนาย (optimistic concurrency) [S6c]
 * body: { expectedRevision, days: [{day, fortune}] } — draft=workspace (ยอมว่าง/ไม่ครบชั่วคราว)
 * revision ไม่ตรง/ไม่ใช่ READY → 409 (กัน stale overwrite)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { editDaily7Draft, draftErrorStatus } from "@/content-creator/daily7-service";
import { WEEKDAYS } from "@/content-creator/templates/daily7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// draft = workspace (ยอมไม่ครบ 7/ว่างชั่วคราว) แต่ bounded: weekday enum + ไม่ซ้ำ + ยาวจำกัด [ตู๋ P2]
const Body = z.object({
  expectedRevision: z.number().int().min(0),
  days: z
    .array(z.object({ day: z.enum(WEEKDAYS), fortune: z.string().max(200) }))
    .max(7)
    .refine((arr) => new Set(arr.map((d) => d.day)).size === arr.length, "day ห้ามซ้ำ"),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี expectedRevision + days)" }, { status: 400 });
  }
  try {
    const draft = editDaily7Draft(getContentDb(), id, body.expectedRevision, body.days);
    return NextResponse.json({ ok: true, draft }, { status: 200 });
  } catch (e) {
    const { status, error } = draftErrorStatus(e);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
