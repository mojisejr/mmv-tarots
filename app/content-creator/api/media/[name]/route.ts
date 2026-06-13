/**
 * GET /content-creator/api/media/[name] — serve ภาพ gen จาก CONTENT_MEDIA_DIR [S3]
 *
 * ⚠️ path traversal (บทเรียน S2 P2): name มาจาก client เชื่อไม่ได้.
 *   - basename() ตัด path component ทิ้ง (../ หาย) + บังคับ .png
 *   - assert resolved path อยู่ใต้ media root จริง (belt-and-suspenders)
 * ไม่ leak fs path ออกไป ; ปิดเมื่อ feature ไม่ enabled (middleware + เช็คซ้ำที่นี่)
 */
import { NextResponse } from "next/server";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mediaDir = () => process.env.CONTENT_MEDIA_DIR || "content-creator/media";

/**
 * คืน absolute path ที่ปลอดภัยจริง หรือ null. กัน traversal 2 ชั้น [ตู๋ P1/P2]:
 *   1. lexical: basename ตัด ../, บังคับ .png
 *   2. symlink: reject ไฟล์ที่เป็น symlink + realpath ต้องยังอยู่ใต้ media root จริง
 *      (lexical resolve อย่างเดียวไม่พอ — symlink ใน media dir ชี้ออกนอกได้)
 */
function safeMediaPath(name: string): string | null {
  const safe = basename(name);
  if (!safe.endsWith(".png")) return null;
  try {
    const root = realpathSync(resolve(mediaDir())); // realpath root (กัน symlink ใน path เช่น /tmp→/private/tmp)
    const candidate = join(root, safe);
    if (!existsSync(candidate)) return null;
    if (lstatSync(candidate).isSymbolicLink()) return null; // ไม่ follow symlink ออกนอก root
    const real = realpathSync(candidate);
    if (real !== candidate) return null; // มี symlink component กลางทาง
    if (real !== root && !real.startsWith(root + sep)) return null; // belt: ยังอยู่ใต้ root
    return real;
  } catch {
    return null; // media dir ไม่มี / stat ล้ม → ถือว่าไม่พบ
  }
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
