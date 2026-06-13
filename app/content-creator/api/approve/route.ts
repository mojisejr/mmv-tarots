/**
 * POST /content-creator/api/approve — ฟีม approve/cancel โพสต์ที่ gen เสร็จ [S3]
 * body: { id, action: "approve" | "cancel" }
 *   approve → GENERATED → APPROVED (เข้าคิวรอ publish — S4)
 *   cancel  → GENERATED → CANCELED (terminal)
 * ใช้ tryTransition (atomic conditional) → ถ้า row ไม่ใช่ GENERATED แล้ว (จัดการไปแล้ว/race) คืน 409
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { tryTransition } from "@/content-creator/db/transition";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "cancel"]),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body (ต้องมี id + action)" }, { status: 400 });
  }

  const to = body.action === "approve" ? "APPROVED" : "CANCELED";
  const db = getContentDb();
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
