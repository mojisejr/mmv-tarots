/**
 * GET /content-creator/api/cards/draft/:id — อ่าน random-cards draft (restore session) [PR#103]
 * (ไม่มี PATCH — random-cards แก้ด้วยการ "สุ่มใหม่" (regenerate) เท่านั้น ไม่ edit ไพ่มือ)
 */
import { NextResponse } from "next/server";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { getDraft } from "@/content-creator/db/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const draft = getDraft(getContentDb(), id);
  if (!draft) return NextResponse.json({ ok: false, error: "ไม่พบ draft" }, { status: 404 });
  return NextResponse.json({ ok: true, draft }, { status: 200 });
}
