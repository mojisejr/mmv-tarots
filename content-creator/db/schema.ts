/**
 * content-creator DB schema — Drizzle + better-sqlite3 (แยกจาก Prisma/Postgres หลัก 100%)
 *
 * ContentPost = 1 โพสต์ที่จะลง FB: ฟีมกรอก input → gen caption+ภาพ → approve → publish → post
 * state machine: PENDING → GENERATED → APPROVED → PUBLISHING → POSTED ; CANCELED/FAILED ดู state.ts
 * (PUBLISHING = claim lease ก่อนยิง Facebook — กัน scheduler concurrent โพสต์ซ้ำ)
 */
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const CONTENT_STATUSES = [
  "PENDING", // เพิ่งกรอก รอ gen
  "GENERATING", // worker claim แล้ว กำลังเรียก Gemini (lease — 1 worker, กัน gen ซ้ำ/เปลือง cost)
  "GENERATED", // gen caption+ภาพ แล้ว รอ approve
  "APPROVED", // ฟีม approve แล้ว รอ scheduler claim
  "PUBLISHING", // worker claim แล้ว กำลังยิง Facebook (lease — 1 worker เท่านั้น)
  "POSTED", // โพสต์ขึ้นเพจแล้ว (terminal)
  "CANCELED", // ยกเลิก (terminal)
  "FAILED", // gen/post ล้มเหลว (retry → PENDING ได้)
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const contentPosts = sqliteTable("content_posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** idempotency key ต่อ "การ submit สร้าง 1 ครั้ง" (client ส่งมา) — unique กัน create ซ้ำ
   *  จาก reload/timeout/double-click/retry → ไม่ยิง Gemini จ่ายซ้ำ [S3.5a ตู๋ P1].
   *  nullable: row เก่า (S1-S3/seed) ไม่มี — sqlite unique อนุญาตหลาย NULL */
  requestKey: text("request_key").unique(),
  /** → Template Registry (S2) — บอกว่า gen รูปแบบไหน */
  templateId: text("template_id").notNull(),
  /** fields ตาม template.inputSchema (card, meaning, …) */
  inputData: text("input_data", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  status: text("status").$type<ContentStatus>().notNull().default("PENDING"),
  /** claim ownership token ของ GENERATING lease — completion/release ต้อง token ตรง (กัน stale worker ทับ) [S2 P1] */
  generationToken: text("generation_token"),
  /** เวลาเริ่ม claim GENERATING — สำหรับ expiry-based reclaim (future reconciliation) */
  generatingAt: integer("generating_at", { mode: "timestamp" }),
  /** ผลลัพธ์ gen (S2) */
  caption: text("caption"),
  imagePath: text("image_path"),
  /** publish-on-approve: upload unpublished แล้วเก็บ media_fbid ไว้ post ตอน publish */
  mediaFbid: text("media_fbid"),
  /** หลัง post สำเร็จ */
  fbPostId: text("fb_post_id"),
  /** เวลาที่ตั้งจะโพสต์ */
  publishAt: integer("publish_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  postedAt: integer("posted_at", { mode: "timestamp" }),
});

export type ContentPost = typeof contentPosts.$inferSelect;
export type NewContentPost = typeof contentPosts.$inferInsert;

/**
 * Brand Profile [S3.5b/c] — แบรนด์ "หมอมี่" ที่ใช้ steer ทุก gen ให้ theme เดียวกัน.
 * singleton: 1 row id="default" (admin tool — แบรนด์เดียว).
 *  - stylePrompt: ต่อท้าย image prompt ทุกครั้ง (palette/props/mood)
 *  - captionPersona: ต่อเข้า caption system (tone หมอมี่)
 *  - refImagePath: ภาพ reference (fix ตัวละคร) → ถ้ามี ใช้ nano banana (gemini-2.5-flash-image)
 *  - imageModel: override CONTENT_IMAGE_MODEL ต่อ brand (null = ใช้ env/default)
 */
export const brandProfile = sqliteTable("brand_profile", {
  id: text("id").primaryKey().$defaultFn(() => "default"),
  stylePrompt: text("style_prompt").notNull().default(""),
  captionPersona: text("caption_persona").notNull().default(""),
  refImagePath: text("ref_image_path"),
  imageModel: text("image_model"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type BrandProfile = typeof brandProfile.$inferSelect;
export type NewBrandProfile = typeof brandProfile.$inferInsert;
