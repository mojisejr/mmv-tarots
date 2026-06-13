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
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { contentPosts } from "@/content-creator/db/schema";
import { getTemplate } from "@/content-creator/templates";
import { generate } from "@/content-creator/engine";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  templateId: z.string().min(1),
  inputData: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี templateId + inputData)" }, { status: 400 });
  }

  // validate ก่อน insert → 400 สะอาด ไม่ทิ้ง PENDING row ขยะถ้า input ผิด
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
  db.insert(contentPosts).values({ id, templateId: body.templateId, inputData: body.inputData, status: "PENDING" }).run();

  // sync gen (เรียก Gemini) — admin tool คนเดียว, รอผลทันที
  const res = await generate(db, id);
  return NextResponse.json(
    { ok: res.ok, id, status: res.status, caption: res.caption, error: res.error },
    { status: res.ok ? 200 : 502 }, // 502 = gen ล้ม (upstream Gemini) ; row จะเป็น FAILED
  );
}
