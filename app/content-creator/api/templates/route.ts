/**
 * GET /content-creator/api/templates — list template ที่มี (สำหรับ dropdown หน้า /new) [S3.5a]
 */
import { NextResponse } from "next/server";
import { getTemplate, listTemplateIds } from "@/content-creator/templates";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const templates = listTemplateIds().map((id) => ({ id, name: getTemplate(id).name }));
  return NextResponse.json({ templates });
}
