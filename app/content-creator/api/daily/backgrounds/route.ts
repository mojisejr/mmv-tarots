/**
 * GET /content-creator/api/daily/backgrounds — list bg pool (id + dimension) สำหรับ bg picker [S6c.2]
 * อ่านจาก manifest committed (ไม่ scan dir) — ตอนนี้ N=1
 */
import { NextResponse } from "next/server";
import { loadManifest } from "@/content-creator/lib/bg-pool";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  try {
    const items = loadManifest().map((e) => ({ id: e.id, width: e.width, height: e.height }));
    return NextResponse.json({ ok: true, backgrounds: items }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
