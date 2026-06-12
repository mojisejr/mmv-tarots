import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { contentPosts } from "../db/schema";
import { assertTransition } from "../db/state";

// in-memory sqlite — พิสูจน์ schema + drizzle insert/select + state machine ทำงานจริง (ไม่แตะ DB หลัก)
function freshDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE content_posts (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      input_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      caption TEXT, image_path TEXT, media_fbid TEXT, fb_post_id TEXT,
      publish_at INTEGER,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, posted_at INTEGER
    );
  `);
  return drizzle(sqlite, { schema });
}

describe("ContentPost DB (Drizzle + better-sqlite3 in-memory)", () => {
  it("insert + select — default PENDING, json input, auto id", () => {
    const db = freshDb();
    db.insert(contentPosts).values({ templateId: "finance-daily", inputData: { card: "Ace of Coins" } }).run();
    const rows = db.select().from(contentPosts).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("PENDING");
    expect(rows[0].inputData).toEqual({ card: "Ace of Coins" });
    expect(rows[0].id).toBeTruthy();
  });

  it("transition PENDING→GENERATED ผ่าน assertTransition + update", () => {
    const db = freshDb();
    db.insert(contentPosts).values({ id: "x", templateId: "t", inputData: {} }).run();
    const before = db.select().from(contentPosts).where(eq(contentPosts.id, "x")).get();
    assertTransition(before!.status, "GENERATED"); // ไม่ throw
    db.update(contentPosts).set({ status: "GENERATED", caption: "ปังมากแม่" }).where(eq(contentPosts.id, "x")).run();
    const after = db.select().from(contentPosts).where(eq(contentPosts.id, "x")).get();
    expect(after!.status).toBe("GENERATED");
    expect(after!.caption).toBe("ปังมากแม่");
  });

  it("กัน transition ผิดก่อน update (PENDING→POSTED)", () => {
    expect(() => assertTransition("PENDING", "POSTED")).toThrow();
  });
});
