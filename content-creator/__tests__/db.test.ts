import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { createContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { transition, tryTransition, claimForPublish, markPosted, releaseClaim } from "../db/transition";

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
    expect(rows[0].status).toBe("PENDING");
    expect(rows[0].inputData).toEqual({ card: "Ace of Coins" });
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

  it("reject transition ที่ไม่ allowed (APPROVED→POSTED) ก่อนแตะ DB", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "y", templateId: "t", inputData: {}, status: "APPROVED" }).run();
    expect(() => transition(db, "y", "APPROVED", "POSTED")).toThrow(/invalid content status transition/);
  });

  it("reject stale/concurrent + ghost id", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "z", templateId: "t", inputData: {} }).run();
    transition(db, "z", "PENDING", "GENERATED");
    expect(() => transition(db, "z", "PENDING", "GENERATED")).toThrow(/stale\/concurrent/);
    expect(() => transition(db, "ghost", "PENDING", "GENERATED")).toThrow(/stale\/concurrent/);
  });
});

describe("[altitude] PUBLISHING claim — กัน scheduler concurrent ยิง FB ซ้ำ", () => {
  it("worker เดียวเท่านั้น claim ได้ (APPROVED→PUBLISHING atomic)", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "p", templateId: "t", inputData: {}, status: "APPROVED" }).run();
    // 2 scheduler ลอง claim พร้อมกัน → คนแรกได้ คนสองไม่ได้
    expect(claimForPublish(db, "p")).toBe(true);
    expect(claimForPublish(db, "p")).toBe(false); // status เป็น PUBLISHING แล้ว
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "p")).get()!.status).toBe("PUBLISHING");
  });

  it("markPosted: PUBLISHING→POSTED + fbPostId; recovery releaseClaim PUBLISHING→FAILED", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "ok", templateId: "t", inputData: {}, status: "APPROVED" }).run();
    claimForPublish(db, "ok");
    markPosted(db, "ok", "fb_123");
    const posted = db.select().from(contentPosts).where(eq(contentPosts.id, "ok")).get()!;
    expect(posted.status).toBe("POSTED");
    expect(posted.fbPostId).toBe("fb_123");
    expect(posted.postedAt).toBeTruthy();

    db.insert(contentPosts).values({ id: "fail", templateId: "t", inputData: {}, status: "APPROVED" }).run();
    claimForPublish(db, "fail");
    releaseClaim(db, "fail"); // ยิง FB ล้ม → PUBLISHING→FAILED
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "fail")).get()!.status).toBe("FAILED");
  });

  it("tryTransition คืน false เมื่อ row ไม่ตรง (ไม่ throw)", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "q", templateId: "t", inputData: {} }).run();
    expect(tryTransition(db, "q", "APPROVED", "PUBLISHING")).toBe(false); // status เป็น PENDING
  });
});

describe("[P1.3] file-backed persist smoke — data อยู่หลัง reopen", () => {
  it("เขียนไฟล์ → เปิดใหม่ path เดิม → data ยังอยู่ (migration idempotent)", () => {
    const path = tmpDbPath();
    const db1 = createContentDb(path);
    db1.insert(contentPosts).values({ id: "persist", templateId: "t", inputData: { x: 1 } }).run();
    const db2 = createContentDb(path);
    const row = db2.select().from(contentPosts).where(eq(contentPosts.id, "persist")).get();
    expect(row!.id).toBe("persist");
    expect(row!.inputData).toEqual({ x: 1 });
  });
});
