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
  // atomic get-or-create: insert ผ่านเฉพาะถ้า requestKey ยังไม่มี (unique). retry/concurrent →
  // changes 0 → ไม่สร้าง row ใหม่ [ตู๋ P1]. ใช้ parsed.data (canonical) ไม่ใช่ raw [ตู๋ P2]
  const id = crypto.randomUUID();
  const ins = db
    .insert(contentPosts)
    .values({ id, requestKey: body.requestKey, templateId: body.templateId, inputData: parsed.data as Record<string, unknown>, status: "PENDING" })
    .onConflictDoNothing({ target: contentPosts.requestKey })
    .run();

  // genId = row ที่จะ gen: ของใหม่ (เราสร้าง) หรือของเดิม (resume)
  let genId = id;

  if (ins.changes === 0) {
    // requestKey นี้มี row อยู่แล้ว (retry/reload/concurrent/crash-after-insert)
    const existing = db.select().from(contentPosts).where(eq(contentPosts.requestKey, body.requestKey)).get();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "conflict แต่หา row เดิมไม่เจอ" }, { status: 409 });
    }
    // same key ต้อง same payload — ถ้าต่าง = key ชน/reuse ผิด → 409 (ไม่คืน row ที่ payload ไม่ตรง) [ตู๋ P1]
    const samePayload =
      existing.templateId === body.templateId &&
      JSON.stringify(existing.inputData) === JSON.stringify(parsed.data);
    if (!samePayload) {
      return NextResponse.json({ ok: false, error: "requestKey ซ้ำแต่ payload ต่าง (key reuse ผิด)" }, { status: 409 });
    }
    // terminal (definitive) → ตอบทันที ไม่ gen ซ้ำ. definitive:true → client clear key ได้ทุกกรณี [ตู๋ P1]
    if (["GENERATED", "APPROVED", "PUBLISHING", "POSTED"].includes(existing.status)) {
      return NextResponse.json({ ok: true, definitive: true, id: existing.id, status: existing.status, caption: existing.caption ?? undefined, idempotent: true }, { status: 200 });
    }
    if (existing.status === "FAILED" || existing.status === "CANCELED") {
      return NextResponse.json({ ok: false, definitive: true, id: existing.id, status: existing.status, idempotent: true }, { status: 200 });
    }
    // PENDING/GENERATING → resume ผ่าน generate() (atomic claim):
    //   PENDING (เช่น process เดิม crash หลัง insert ก่อน claim) → claim ได้ → gen ต่อ (resume) [ตู๋ P1]
    //   GENERATING (อีก request กำลังทำ) → claim ไม่ได้ → SKIPPED → 202
    genId = existing.id;
  }

  // gen (เราสร้างใหม่ หรือ resume PENDING ที่ค้าง) — generate() claim atomic ภายใน
  const res = await generate(db, genId);
  if (res.status === "SKIPPED") {
    // claim ไม่ได้ = อีก request กำลัง gen (GENERATING) — ยังไม่ definitive, client เก็บ key ไว้
    const cur = db.select().from(contentPosts).where(eq(contentPosts.id, genId)).get();
    return NextResponse.json({ ok: false, definitive: false, inProgress: true, id: genId, status: cur?.status ?? "GENERATING", idempotent: true }, { status: 202 });
  }
  // GENERATED / FAILED = definitive (ผ่าน gen แล้ว) → client clear key
  return NextResponse.json(
    { ok: res.ok, definitive: true, id: genId, status: res.status, caption: res.caption, error: res.error },
    { status: res.ok ? 200 : 502 }, // 502 = gen ล้ม (upstream Gemini) ; row จะเป็น FAILED
  );
}
