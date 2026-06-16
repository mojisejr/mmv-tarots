/**
 * daily-7 publish scheduler worker [S4b] — long-running process (รันด้วย pm2)
 *
 * reconcile loop: tick ทุก ~10-15 นาที (setInterval ไม่ใช้ node-cron — ไม่ต้องการ cron expr).
 * แต่ละ tick: auto-cancel stale + (ถ้าถึงเวลา+มีของวันนี้) โพสต์ 1 อัน. fence การันตี 1/วัน.
 * pm2 autorestart + startup → ดับแล้วฟื้นเอง ; ตื่นช้า → รอบถัดไป catch-up.
 *
 * env ที่ต้องมี (pm2 env / shell): CONTENT_DB_PATH (sqlite จริง), CONTENT_FB_PAGE_ID,
 *   CONTENT_FB_PAGE_ACCESS_TOKEN ; optional CONTENT_SCHEDULE_DAYS, CONTENT_SCHEDULE_SLOTS,
 *   CONTENT_SCHEDULE_TICK_MS
 * รันบนเครื่อง/server ที่มี DB + token (ไม่ใช่ Vercel — DB เป็น local file)
 */
import { getContentDb } from "../content-creator/db/client";
import { runSchedulerTick, getScheduleConfig } from "../content-creator/scheduler";
import { fbPageId, fbPageToken } from "../content-creator/lib/config";

const INTERVAL_MS = Number(process.env.CONTENT_SCHEDULE_TICK_MS ?? 10 * 60 * 1000);

async function tick(): Promise<void> {
  const pageId = fbPageId();
  const token = fbPageToken();
  if (!pageId || !token) {
    console.error("[publish-worker] FB env ไม่ครบ (CONTENT_FB_PAGE_ID / CONTENT_FB_PAGE_ACCESS_TOKEN) — skip tick");
    return;
  }
  try {
    const result = await runSchedulerTick(getContentDb(), { pageId, token, config: getScheduleConfig() });
    console.log(`[publish-worker] ${new Date().toISOString()} ${JSON.stringify(result)}`);
  } catch (e) {
    console.error("[publish-worker] tick error:", e instanceof Error ? e.message : e);
  }
}

console.log(`[publish-worker] started — tick ทุก ${INTERVAL_MS}ms · config ${JSON.stringify(getScheduleConfig())}`);
void tick(); // ตื่นทันทีรอบแรก
setInterval(() => void tick(), INTERVAL_MS);
