/**
 * content-creator DB client — better-sqlite3 + Drizzle (server-only, แยกจาก DB หลัก)
 *
 * - apply migration ตอนสร้าง (startup contract — table พร้อมใช้, ไม่เจอ "no such table") [P1.1]
 * - local-only: file SQLite ไม่ persist บน Vercel serverless (ephemeral fs) → guard [P1.3]
 * - native module → serverExternalPackages ใน next.config; Node pin 22 (.nvmrc/engines) [P2]
 */
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const MIGRATIONS_FOLDER = "content-creator/db/migrations";

export type ContentDb = BetterSQLite3Database<typeof schema>;

/**
 * สร้าง DB connection + apply migration (table พร้อมใช้ทันที).
 * @param dbPath path ของ SQLite file หรือ ":memory:"
 * @throws ถ้ารันบน Vercel serverless (file SQLite ไม่ persist — local-only)
 */
export function createContentDb(dbPath: string): ContentDb {
  // [P1.3] local-only — Vercel serverless fs เป็น ephemeral/แยก instance ไม่ใช่ persistent shared DB
  if (process.env.VERCEL && process.env.CONTENT_DB_ALLOW_EPHEMERAL !== "true") {
    throw new Error(
      "content-creator DB เป็น local-only: file SQLite ไม่ persist บน Vercel serverless. " +
        "รัน local (next dev) หรือ host ที่มี persistent volume (set CONTENT_DB_ALLOW_EPHEMERAL=true เพื่อ override)",
    );
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }); // startup contract: schema applied
  return db;
}

let cached: ContentDb | undefined;

/** singleton DB (lazy) — เปิด + migrate ตอนเรียกครั้งแรก */
export function getContentDb(): ContentDb {
  if (!cached) {
    cached = createContentDb(process.env.CONTENT_DB_PATH || "content-creator/content.db");
  }
  return cached;
}
