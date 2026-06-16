/**
 * scheduler reconcile loop [S4b] — pm2 worker เรียก runSchedulerTick ทุก ~10-15 นาที (node-cron)
 *
 * ไม่ใช่ "ยิงตอน slot เป๊ะ" — ตื่นมา reconcile สถานะที่ควรเป็น (idempotent):
 *  1. auto-cancel stale daily-7 (APPROVED + targetDate < วันนี้) atomic [ตู๋ P1] — กันโพสต์ของผิดวัน
 *  2. gate: วันนี้อยู่ใน schedule days + ถึงเวลา slot แล้ว (Bangkok) — ไม่งั้น window closed
 *  3. หยิบ APPROVED daily-7 targetDate=วันนี้ (เก่าสุด) → publishApprovedPost (shared policy)
 *     per-day fence + staleness guard อยู่ใน publish-service → ตื่นซ้ำ/ดับแล้วฟื้น = catch-up ไม่ซ้ำ
 */
import { and, asc, eq, sql } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { contentPosts } from "./db/schema";
import { publishApprovedPost, type PublishOutcome } from "./publish-service";
import { bangkokTodayISO, bangkokMinutesOfDay, bangkokDayOfWeek, hhmmToMinutes } from "./lib/time";

const DAILY7 = "daily-7";

export interface ScheduleConfig {
  /** วันที่โพสต์ (0=อาทิตย์..6=เสาร์) ; default ทุกวัน */
  days: number[];
  /** slot times "HH:mm" ; ขั้นแรก 1 รอบ/วัน (fence การันตี 1 โพสต์/วัน) */
  slots: string[];
}

export function getScheduleConfig(): ScheduleConfig {
  const days = (process.env.CONTENT_SCHEDULE_DAYS ?? "0,1,2,3,4,5,6").split(",").map((s) => Number(s.trim())).filter((n) => n >= 0 && n <= 6);
  const slots = (process.env.CONTENT_SCHEDULE_SLOTS ?? "09:00").split(",").map((s) => s.trim()).filter(Boolean);
  return { days, slots };
}

export interface TickDeps {
  pageId: string;
  token: string;
  config: ScheduleConfig;
  /** inject สำหรับ test ; default = ตอนนี้จริง */
  now?: Date;
}

export interface TickResult {
  today: string;
  canceledStale: number;
  window: "closed-day" | "closed-time" | "open";
  published?: { id: string; status: PublishOutcome["status"] };
  note: string;
}

export async function runSchedulerTick(db: ContentDb, deps: TickDeps): Promise<TickResult> {
  const now = deps.now ?? new Date();
  const today = bangkokTodayISO(now);

  // 1. auto-cancel stale daily-7 (atomic: เฉพาะ row ที่ยัง APPROVED + targetDate < วันนี้) [ตู๋ P1]
  const canceled = db
    .update(contentPosts)
    .set({ status: "CANCELED", updatedAt: now })
    .where(and(eq(contentPosts.status, "APPROVED"), eq(contentPosts.templateId, DAILY7), sql`json_extract(${contentPosts.inputData}, '$.targetDate') < ${today}`))
    .run();
  const canceledStale = canceled.changes;

  // 2. gate วัน + เวลา (Bangkok)
  if (!deps.config.days.includes(bangkokDayOfWeek(now))) {
    return { today, canceledStale, window: "closed-day", note: `วันนี้ไม่อยู่ใน schedule days` };
  }
  const earliestSlot = Math.min(...deps.config.slots.map(hhmmToMinutes));
  if (bangkokMinutesOfDay(now) < earliestSlot) {
    return { today, canceledStale, window: "closed-time", note: `ยังไม่ถึงเวลา slot (${deps.config.slots.join(",")})` };
  }

  // 3. หยิบ APPROVED daily-7 ของวันนี้ (เก่าสุด) → publish (fence การันตี 1/วัน ; ตื่นซ้ำไม่โพสต์ซ้ำ)
  const cand = db
    .select()
    .from(contentPosts)
    .where(and(eq(contentPosts.status, "APPROVED"), eq(contentPosts.templateId, DAILY7), sql`json_extract(${contentPosts.inputData}, '$.targetDate') = ${today}`))
    .orderBy(asc(contentPosts.createdAt))
    .limit(1)
    .get();

  if (!cand) {
    return { today, canceledStale, window: "open", note: "ไม่มี daily-7 ของวันนี้ในคิว (ว่าง)" };
  }
  const outcome = await publishApprovedPost(db, cand.id, { pageId: deps.pageId, token: deps.token, today });
  return { today, canceledStale, window: "open", published: { id: cand.id, status: outcome.status }, note: outcome.ok ? "โพสต์สำเร็จ" : outcome.reason };
}
