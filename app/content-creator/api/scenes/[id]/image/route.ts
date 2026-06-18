/** GET /content-creator/api/scenes/:id/image — serve scene png (lookup id→imagePath ใน DB) [PR#105 ก้อน3] */
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { sceneLibrary } from "@/content-creator/db/schema";
import { safeResolveUnderRoot } from "@/content-creator/lib/safe-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const { id } = await ctx.params;
  const row = getContentDb().select().from(sceneLibrary).where(eq(sceneLibrary.id, id)).get();
  if (!row) return new NextResponse(null, { status: 404 });
  // imagePath มาจาก DB (ไม่ใช่ client) แต่ safeResolve กัน traversal/symlink อีกชั้น
  const full = safeResolveUnderRoot(process.cwd(), row.imagePath);
  if (!full) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(readFileSync(full)), {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
