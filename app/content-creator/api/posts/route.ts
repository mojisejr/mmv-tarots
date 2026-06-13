/**
 * GET /content-creator/api/posts — list โพสต์ล่าสุด (approve queue + สถานะอื่นเพื่อ context) [S3]
 * อยู่ใต้ prefix /content-creator → middleware guard ครอบ ; เช็ค enabled ซ้ำ (defense-in-depth)
 */
import { NextResponse } from "next/server";
import { basename } from "node:path";
import { desc } from "drizzle-orm";
import { getContentDb } from "@/content-creator/db/client";
import { contentPosts } from "@/content-creator/db/schema";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs"; // better-sqlite3 = native (ต้อง node ไม่ใช่ edge)
export const dynamic = "force-dynamic"; // อ่าน DB ทุก request — ห้าม static cache

export async function GET() {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  const db = getContentDb();
  const rows = db.select().from(contentPosts).orderBy(desc(contentPosts.updatedAt)).limit(50).all();

  // imagePath (path บนเครื่อง) → media URL ผ่าน route ที่ serve อย่างปลอดภัย (ไม่ leak fs path)
  const posts = rows.map((r) => ({
    id: r.id,
    templateId: r.templateId,
    status: r.status,
    caption: r.caption,
    inputData: r.inputData,
    imageUrl: r.imagePath ? `/content-creator/api/media/${basename(r.imagePath)}` : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json({ posts });
}
