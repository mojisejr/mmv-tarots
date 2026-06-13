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
  /** → Template Registry (S2) — บอกว่า gen รูปแบบไหน */
  templateId: text("template_id").notNull(),
  /** fields ตาม template.inputSchema (card, meaning, …) */
  inputData: text("input_data", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  status: text("status").$type<ContentStatus>().notNull().default("PENDING"),
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
