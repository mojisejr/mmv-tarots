/**
 * POST /content-creator/api/approve — ฟีมจัดการโพสต์ที่ gen เสร็จ (GENERATED) [S3 / PR#100]
 * body: { id, action: "approve" | "cancel" | "posted" }
 *   posted  → GENERATED → POSTED (manual: ฟีมโพสต์ FB เองแล้วบันทึกว่าโพสต์แล้ว — fbPostId=null) [PR#100]
 *   cancel  → GENERATED → CANCELED (terminal)
 *   approve → GENERATED → APPROVED (auto path เดิม — เก็บไว้แต่ไม่ใช้ใน UX ใหม่)
 * ใช้ atomic conditional → ถ้า row ไม่ใช่ GENERATED แล้ว (จัดการไปแล้ว/race) คืน 409
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { markPostedManual, tryTransition } from "@/content-creator/db/transition";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "cancel", "posted"]),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี id + action)" }, { status: 400 });
  }

  const db = getContentDb();

  // manual mark posted [PR#100] — domain result (fence/replay) → HTTP
  if (body.action === "posted") {
    const result = markPostedManual(db, body.id);
    if (result === "ok") return NextResponse.json({ ok: true, id: body.id, status: "POSTED" });
    if (result === "fence") {
      return NextResponse.json(
        { ok: false, error: "วันนี้มีโพสต์ daily-7 แล้ว (1 โพสต์/วัน)" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "โพสต์ไม่อยู่สถานะ GENERATED (อาจถูกจัดการไปแล้ว หรือไม่พบ id)" },
      { status: 409 },
    );
  }

  const to = body.action === "approve" ? "APPROVED" : "CANCELED";
  // atomic: เปลี่ยนเฉพาะถ้ายังเป็น GENERATED จริง — กัน double-approve / จัดการชน
  const ok = tryTransition(db, body.id, "GENERATED", to);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "โพสต์ไม่อยู่สถานะ GENERATED (อาจถูกจัดการไปแล้ว หรือไม่พบ id)" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, id: body.id, status: to });
}
