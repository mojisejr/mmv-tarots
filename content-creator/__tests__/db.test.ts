import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { createContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { transition } from "../db/transition";

const tmpDirs: string[] = [];
function tmpDbPath() {
  const dir = mkdtempSync(join(tmpdir(), "cc-db-"));
  tmpDirs.push(dir);
  return join(dir, "test.db");
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("[P1.1] public client บน fresh DB — migration apply ให้ table พร้อม", () => {
  it(":memory: → createContentDb แล้ว query ได้ (ไม่เจอ no such table)", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ templateId: "finance-daily", inputData: { card: "Ace of Coins" } }).run();
    const rows = db.select().from(contentPosts).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("PENDING"); // default
    expect(rows[0].inputData).toEqual({ card: "Ace of Coins" });
    expect(rows[0].id).toBeTruthy();
  });
});

describe("[P1.2] atomic conditional transition", () => {
  it("transition PENDING→GENERATED สำเร็จ + set patch", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "x", templateId: "t", inputData: {} }).run();
    transition(db, "x", "PENDING", "GENERATED", { caption: "ปังมากแม่" });
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, "x")).get();
    expect(row!.status).toBe("GENERATED");
    expect(row!.caption).toBe("ปังมากแม่");
  });

  it("reject transition ที่ไม่ allowed (PENDING→POSTED) — ก่อนแตะ DB", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "y", templateId: "t", inputData: {} }).run();
    expect(() => transition(db, "y", "PENDING", "POSTED")).toThrow(/invalid content status transition/);
  });

  it("reject stale/concurrent — transition ซ้ำจาก state เดิม (post ซ้ำไม่ได้)", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "z", templateId: "t", inputData: {} }).run();
    transition(db, "z", "PENDING", "GENERATED"); // ครั้งแรกสำเร็จ
    // ครั้งที่สอง: status เป็น GENERATED แล้ว → WHERE status=PENDING ไม่ match → changes 0 → throw
    expect(() => transition(db, "z", "PENDING", "GENERATED")).toThrow(/stale\/concurrent/);
  });

  it("reject transition บน id ที่ไม่มี (changes 0)", () => {
    const db = createContentDb(":memory:");
    expect(() => transition(db, "ghost", "PENDING", "GENERATED")).toThrow(/stale\/concurrent/);
  });
});

describe("[P1.3] file-backed persist smoke — data อยู่หลัง reopen", () => {
  it("เขียนไฟล์ → เปิดใหม่ path เดิม → data ยังอยู่ (migration idempotent)", () => {
    const path = tmpDbPath();
    const db1 = createContentDb(path);
    db1.insert(contentPosts).values({ id: "persist", templateId: "t", inputData: { x: 1 } }).run();

    // เปิด connection ใหม่บน file เดิม (migrate รันซ้ำได้ — idempotent)
    const db2 = createContentDb(path);
    const row = db2.select().from(contentPosts).where(eq(contentPosts.id, "persist")).get();
    expect(row!.id).toBe("persist");
    expect(row!.inputData).toEqual({ x: 1 });
  });
});
