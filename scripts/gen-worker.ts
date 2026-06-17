/**
 * gen-worker [Phase 2b] — pm2 worker เรียก runGenTick เป็นระยะ → auto-gen daily-7 ของวันนี้
 *
 * ไม่แตะ Facebook เลย (ต่างจาก publish-worker เดิมที่ legacy/ไม่ใช้แล้ว) — ใช้แค่:
 *   CONTENT_DB_PATH (sqlite path เต็ม) + Gemini key (gen 7 คำทำนาย + caption ผ่าน .env.local)
 * ไม่ต้องมี CONTENT_FB_* — gen เสร็จได้ GENERATED รอฟีมโพสต์ FB เอง.
 *
 * tick ไม่ overlap: in-process running flag (worker เดียว process เดียว) — กัน tick ซ้อนจ่าย gen ซ้ำ.
 */
import { getContentDb } from "../content-creator/db/client";
import { runGenTick, getGenConfig } from "../content-creator/gen-scheduler";

const INTERVAL_MS = Number(process.env.CONTENT_GEN_TICK_MS ?? 10 * 60 * 1000); // default 10 นาที
let running = false;

async function tick(): Promise<void> {
  if (running) {
    console.log("[gen-worker] tick ก่อนยังไม่เสร็จ — skip (กัน gen ซ้อน)");
    return;
  }
  running = true;
  try {
    const result = await runGenTick(getContentDb(), { config: getGenConfig() });
    console.log(`[gen-worker] ${new Date().toISOString()} ${JSON.stringify(result)}`);
  } catch (e) {
    console.error("[gen-worker] tick error:", e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}

// getGenConfig() เรียกตอน start ด้วย → config ผิด = throw = worker ไม่ start (fail-closed)
console.log(`[gen-worker] started — tick ทุก ${INTERVAL_MS}ms · config ${JSON.stringify(getGenConfig())}`);
void tick(); // tick แรกทันที
setInterval(() => void tick(), INTERVAL_MS);
