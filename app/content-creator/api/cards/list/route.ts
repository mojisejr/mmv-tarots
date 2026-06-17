/**
 * GET /content-creator/api/cards/list — รายชื่อไพ่ใน pool (สำหรับ UI map cardId → ชื่อ) [PR#103]
 */
import { NextResponse } from "next/server";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { loadCardManifest } from "@/content-creator/lib/card-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  try {
    const cards = loadCardManifest().map((c) => ({ id: c.id, nameTh: c.nameTh, nameEn: c.nameEn }));
    return NextResponse.json({ ok: true, cards });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
