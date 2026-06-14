/**
 * GET /content-creator/api/media/[name] — serve ภาพ gen จาก CONTENT_MEDIA_DIR [S3]
 *
 * ⚠️ path traversal (บทเรียน S2 P2): name มาจาก client เชื่อไม่ได้.
 *   - basename() ตัด path component ทิ้ง (../ หาย) + บังคับ .png
 *   - assert resolved path อยู่ใต้ media root จริง (belt-and-suspenders)
 * ไม่ leak fs path ออกไป ; ปิดเมื่อ feature ไม่ enabled (middleware + เช็คซ้ำที่นี่)
 */
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { safeResolveUnderRoot } from "@/content-creator/lib/safe-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mediaDir = () => process.env.CONTENT_MEDIA_DIR || "content-creator/media";

/** path-safe ผ่าน util เดียว [S4a refactor] + บังคับ .png + ตัด path component จาก URL param */
function safeMediaPath(name: string): string | null {
  const safe = basename(name);
  if (!safe.endsWith(".png")) return null;
  return safeResolveUnderRoot(mediaDir(), safe);
}

export async function GET(_request: Request, ctx: { params: Promise<{ name: string }> }) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  const { name } = await ctx.params;
  const full = safeMediaPath(name);
  if (!full) return new NextResponse(null, { status: 404 });

  const bytes = readFileSync(full);
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
