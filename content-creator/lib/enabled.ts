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
  // hard-off ทุก production — รวม self-host/docker (non-Vercel) ที่ NODE_ENV=production.
  // admin tool รัน local dev เท่านั้น (script content-creator:dev → next dev → NODE_ENV=development)
  // API ไม่มี user auth → production ห้ามเปิดเด็ดขาด แม้ตั้ง CONTENT_CREATOR_ENABLED=true [ตู๋ P1]
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL) return false; // belt: preview/serverless บน Vercel ก็ปิด
  return process.env.CONTENT_CREATOR_ENABLED === "true";
}
