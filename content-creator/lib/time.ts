/**
 * time helper [S4b] — เขตเวลากรุงเทพ (เส้นวัน/เที่ยงคืนใช้ Asia/Bangkok เสมอ ไม่พึ่ง tz เครื่อง/UTC)
 */

/** วันนี้ตามกรุงเทพ (YYYY-MM-DD) */
export function bangkokTodayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** เวลาปัจจุบันกรุงเทพเป็นนาทีจากเที่ยงคืน (สำหรับ publish window now >= HH:mm) */
export function bangkokMinutesOfDay(now: Date = new Date()): number {
  const hm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/** "HH:mm" → นาทีจากเที่ยงคืน */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** วันในสัปดาห์ตามกรุงเทพ (0=อาทิตย์..6=เสาร์) — derive จากวันปฏิทิน Bangkok (ไม่พึ่ง tz เครื่อง) */
export function bangkokDayOfWeek(now: Date = new Date()): number {
  const [y, m, d] = bangkokTodayISO(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
