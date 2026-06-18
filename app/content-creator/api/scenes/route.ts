/** GET /content-creator/api/scenes?status=PENDING — list scenes สำหรับ Gallery [PR#105 ก้อน3] */
import { NextResponse } from "next/server";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { listScenes, countApproved } from "@/content-creator/scene-pool";
import type { SceneStatus } from "@/content-creator/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "RETIRED"];

export async function GET(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const sp = new URL(request.url).searchParams.get("status");
  const status = sp && STATUSES.includes(sp) ? (sp as SceneStatus) : undefined;
  const db = getContentDb();
  const scenes = listScenes(db, status).map((s) => ({ id: s.id, theme: s.theme, status: s.status, genBatch: s.genBatch }));
  return NextResponse.json({ ok: true, scenes, approvedCount: countApproved(db) });
}
