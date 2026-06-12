/**
 * content-creator DB client — better-sqlite3 + Drizzle (server-only, แยกจาก DB หลัก)
 *
 * better-sqlite3 = native module → mark serverExternalPackages ใน next.config (ไม่ให้ Next bundle)
 * DB file แยกของตัวเอง (CONTENT_DB_PATH) ไม่แตะ Postgres/Neon ของ mmv
 */
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH = process.env.CONTENT_DB_PATH || "content-creator/content.db";

let cached: BetterSQLite3Database<typeof schema> | undefined;

/** singleton DB (lazy) — เปิดไฟล์ตอนเรียกครั้งแรกเท่านั้น */
export function getContentDb(): BetterSQLite3Database<typeof schema> {
  if (!cached) {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    cached = drizzle(sqlite, { schema });
  }
  return cached;
}
