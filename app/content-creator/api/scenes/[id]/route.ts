/** POST /content-creator/api/scenes/:id {action: approve|reject|retire} — status transition [PR#105 ก้อน3] */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { approveScene, rejectScene, retireScene } from "@/content-creator/scene-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const Body = z.object({ action: z.enum(["approve", "reject", "retire"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  let action: "approve" | "reject" | "retire";
  try { action = Body.parse(await request.json()).action; } catch { return NextResponse.json({ ok: false, error: "invalid action" }, { status: 400 }); }
  const db = getContentDb();
  const fn = { approve: approveScene, reject: rejectScene, retire: retireScene }[action];
  const ok = fn(db, id);
  if (!ok) return NextResponse.json({ ok: false, error: `scene ไม่อยู่สถานะที่ ${action} ได้ (อาจถูกจัดการไปแล้ว)` }, { status: 409 });
  return NextResponse.json({ ok: true, id, action });
}
