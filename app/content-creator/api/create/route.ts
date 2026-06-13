/**
 * POST /content-creator/api/create — สร้าง content + gen (sync) [S3.5a]
 * body: { templateId, inputData }
 *   1. validate template + input (clean 400 ก่อน — ไม่ทิ้ง row ขยะ)
 *   2. insert PENDING
 *   3. generate() sync (เรียก Gemini, ~10s) → GENERATED/FAILED
 *   4. คืนผล (ฟีมเด้งกลับไปคิว approve)
 * แทน dev script seed-and-gen ด้วยปุ่มจริง — pipeline ครบ input→approve ผ่าน UI
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { contentPosts } from "@/content-creator/db/schema";
import { getTemplate } from "@/content-creator/templates";
import { generate } from "@/content-creator/engine";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  // idempotency key (client ส่ง 1 อันต่อ submit) — กัน create ซ้ำจาก retry/reload/double-click
  requestKey: z.string().min(1),
  templateId: z.string().min(1),
  inputData: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี requestKey + templateId + inputData)" }, { status: 400 });
  }

  // validate ก่อน insert → 400 สะอาด ไม่ทิ้ง row ขยะถ้า input ผิด
  let template;
  try {
    template = getTemplate(body.templateId);
  } catch {
    return NextResponse.json({ ok: false, error: `unknown template: ${body.templateId}` }, { status: 400 });
  }
  const parsed = template.inputSchema.safeParse(body.inputData);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "input ไม่ตรง schema ของ template" }, { status: 400 });
  }

  const db = getContentDb();
  const id = crypto.randomUUID();
  // atomic get-or-create: insert ผ่านเฉพาะถ้า requestKey ยังไม่มี (unique). retry/concurrent →
  // changes 0 → ไม่ยิง Gemini ซ้ำ, คืน row เดิม [ตู๋ P1]. ใช้ parsed.data (canonical) ไม่ใช่ raw [ตู๋ P2]
  const ins = db
    .insert(contentPosts)
    .values({ id, requestKey: body.requestKey, templateId: body.templateId, inputData: parsed.data as Record<string, unknown>, status: "PENDING" })
    .onConflictDoNothing({ target: contentPosts.requestKey })
    .run();

  if (ins.changes === 0) {
    // requestKey นี้สร้างไปแล้ว (retry/reload/concurrent) — คืน row เดิม ไม่ gen ซ้ำ (ไม่จ่าย Gemini ซ้ำ)
    const existing = db.select().from(contentPosts).where(eq(contentPosts.requestKey, body.requestKey)).get();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "conflict แต่หา row เดิมไม่เจอ" }, { status: 409 });
    }
    // same key ต้อง same payload — ถ้าต่าง = key ชน/reuse ผิด → 409 (ไม่คืน row ที่ payload ไม่ตรง) [ตู๋ P1]
    const samePayload =
      existing.templateId === body.templateId &&
      JSON.stringify(existing.inputData) === JSON.stringify(parsed.data);
    if (!samePayload) {
      return NextResponse.json(
        { ok: false, error: "requestKey ซ้ำแต่ payload ต่าง (key reuse ผิด)" },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: existing.status !== "FAILED", id: existing.id, status: existing.status, caption: existing.caption ?? undefined, idempotent: true });
  }

  // เราเป็นคนสร้าง row นี้ → gen (sync, เรียก Gemini)
  const res = await generate(db, id);
  return NextResponse.json(
    { ok: res.ok, id, status: res.status, caption: res.caption, error: res.error },
    { status: res.ok ? 200 : 502 }, // 502 = gen ล้ม (upstream Gemini) ; row จะเป็น FAILED
  );
}
