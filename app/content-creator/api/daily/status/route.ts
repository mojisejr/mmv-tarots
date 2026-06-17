/**
 * GET /content-creator/api/daily/status — สถานะ daily-7 ของวันนี้ (สำหรับ modal แจ้งเตือน) [S4b]
 * { today, posted (โพสต์วันนี้แล้ว?), pending (APPROVED รอโพสต์วันนี้), staleCanceled (เพิ่งถูก auto-cancel) }
 */
import { NextResponse } from "next/server";
import { and, eq, gte, sql, type SQL } from "drizzle-orm";
import { getContentDb } from "@/content-creator/db/client";
import { contentPosts } from "@/content-creator/db/schema";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { bangkokTodayISO } from "@/content-creator/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY7 = "daily-7";
const td = sql`json_extract(${contentPosts.inputData}, '$.targetDate')`;

export async function GET() {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const db = getContentDb();
  const today = bangkokTodayISO();
  const count = (where: SQL | undefined) => db.select({ id: contentPosts.id }).from(contentPosts).where(where).all().length;

  const posted = count(and(eq(contentPosts.templateId, DAILY7), eq(contentPosts.status, "POSTED"), sql`${td} = ${today}`));
  const pending = count(and(eq(contentPosts.templateId, DAILY7), eq(contentPosts.status, "APPROVED"), sql`${td} = ${today}`));
  // เพิ่งถูก auto-cancel เพราะเลยวัน (24 ชม.ล่าสุด) — surface ให้ฟีมรู้ว่าพลาดโพสต์
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const staleCanceled = count(and(eq(contentPosts.templateId, DAILY7), eq(contentPosts.status, "CANCELED"), sql`${td} < ${today}`, gte(contentPosts.updatedAt, cutoff)));
  // PUBLISHING ค้าง = ambiguous (worker ตายหลังยิง feed) → ต้อง reconcile มือ [S4b ตู๋ P1]
  const stuckPublishing = count(and(eq(contentPosts.templateId, DAILY7), eq(contentPosts.status, "PUBLISHING")));
  // auto-gen วันนี้ FAILED → surface ให้ฟีมรู้ว่าต้อง manual (ไม่เงียบ) [Phase 2b ตู๋ P2]
  const failedToday = count(and(eq(contentPosts.templateId, DAILY7), eq(contentPosts.status, "FAILED"), sql`${td} = ${today}`));

  return NextResponse.json({ ok: true, today, posted: posted > 0, pending, staleCanceled, stuckPublishing, failedToday });
}
