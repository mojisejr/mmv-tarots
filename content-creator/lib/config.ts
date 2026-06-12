/**
 * content-creator config — env/version แยกจาก mmv core (Gate A: env แยก, Gate B: version ไม่ hardcode)
 */

/** Graph API version — config ไม่ hardcode ในแต่ละ call (Meta deprecate ~2 ปี) */
export const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || "v23.0";

/** สร้าง Graph API URL จาก path (ไม่มี access_token ใน URL — token ไป header, ดู facebook.ts) */
export const graphUrl = (path: string): string =>
  `https://graph.facebook.com/${GRAPH_VERSION}/${path.replace(/^\//, "")}`;

/** model สำหรับ caption — env แยก ไม่ reuse MODEL_NAME ของ mystic (Gate A) */
export const TEXT_MODEL = process.env.CONTENT_TEXT_MODEL || "gemini-2.5-flash";

/** model สำหรับภาพ — env แยก */
export const IMAGE_MODEL = process.env.CONTENT_IMAGE_MODEL || "imagen-4.0-generate-001";

/** caption temperature เริ่มต้น (คุม tone — override ได้ต่อ call) */
export const DEFAULT_CAPTION_TEMPERATURE = 0.8;
