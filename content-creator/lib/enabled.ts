/**
 * content-creator runtime gate — เปิด/ปิด feature [S3]
 *
 * โมดูลนี้ตั้งใจให้ **zero import** (อ่าน process.env อย่างเดียว) → edge-safe:
 * ใช้ได้ทั้ง middleware (edge runtime) และ route handler (node) แบบ single source.
 *
 * fail-closed: ปิดเป็น default. เปิดเฉพาะ local dev ที่ตั้ง CONTENT_CREATOR_ENABLED=true.
 * บน Vercel/serverless ปิดเสมอ (admin tool รัน local เท่านั้น — ดู README runtime contract).
 */
export function isContentCreatorEnabled(): boolean {
  if (process.env.VERCEL) return false; // hard off บน Vercel เสมอ (กัน expose แม้เผลอ set env)
  return process.env.CONTENT_CREATOR_ENABLED === "true";
}
