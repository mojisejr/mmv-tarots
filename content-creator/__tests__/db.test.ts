import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { createContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { transition, tryTransition, claimForPublish, markPosted, releaseClaim, markPostedManual } from "../db/transition";
import { canTransition } from "../db/state";

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
  it("transition PENDING→GENERATING สำเร็จ + set patch", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "x", templateId: "t", inputData: {} }).run();
    transition(db, "x", "PENDING", "GENERATING", { caption: "ปังมากแม่" });
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, "x")).get();
    expect(row!.status).toBe("GENERATING");
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
    transition(db, "z", "PENDING", "GENERATING");
    expect(() => transition(db, "z", "PENDING", "GENERATING")).toThrow(/stale\/concurrent/);
    expect(() => transition(db, "ghost", "PENDING", "GENERATING")).toThrow(/stale\/concurrent/);
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

describe("[PR#100] manual mark posted — ฟีมโพสต์ FB เอง [ตู๋ P1]", () => {
  function genDaily7(db: ReturnType<typeof createContentDb>, id: string, targetDate: string) {
    db.insert(contentPosts)
      .values({ id, templateId: "daily-7", inputData: { targetDate, days: [] }, status: "GENERATED", caption: "c", imagePath: `/m/${id}.png` })
      .run();
  }
  const statusOf = (db: ReturnType<typeof createContentDb>, id: string) =>
    db.select().from(contentPosts).where(eq(contentPosts.id, id)).get()?.status;

  it("GENERATED→POSTED สำเร็จ + fbPostId=null (ไม่ใช่ publish ผ่าน API)", () => {
    const db = createContentDb(":memory:");
    genDaily7(db, "g", "2026-06-21");
    expect(markPostedManual(db, "g")).toBe("ok");
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, "g")).get();
    expect(row!.status).toBe("POSTED");
    expect(row!.fbPostId).toBeNull(); // manual: ไม่มี fbPostId
    expect(row!.postedAt).not.toBeNull();
  });

  it("[P1.3] same-row replay (กดซ้ำ/response หาย) → ok idempotent ไม่ทำซ้ำ", () => {
    const db = createContentDb(":memory:");
    genDaily7(db, "g", "2026-06-21");
    expect(markPostedManual(db, "g")).toBe("ok");
    expect(markPostedManual(db, "g")).toBe("ok"); // replay
    expect(statusOf(db, "g")).toBe("POSTED");
  });

  it("[fence 0008] DB block insert daily-7 ตัวที่ 2 วันเดียวกัน (non-canceled) → row แรกยัง mark posted ได้", () => {
    const db = createContentDb(":memory:");
    genDaily7(db, "a", "2026-06-20");
    // broad fence (idx 0008): 1 non-canceled artifact/วัน → ตัวที่ 2 ถูก block ตั้งแต่ insert
    expect(() => genDaily7(db, "b", "2026-06-20")).toThrow(/UNIQUE constraint/);
    expect(markPostedManual(db, "a")).toBe("ok"); // row เดียว → mark posted ปกติ
    expect(statusOf(db, "a")).toBe("POSTED");
  });

  it("[fence 0008] CANCELED ไม่นับใน fence → สร้างใหม่วันเดียวกันได้หลังยกเลิกตัวเดิม", () => {
    const db = createContentDb(":memory:");
    genDaily7(db, "old", "2026-06-25");
    tryTransition(db, "old", "GENERATED", "CANCELED"); // ยกเลิกตัวเดิม
    expect(() => genDaily7(db, "new", "2026-06-25")).not.toThrow(); // วันเดียวกันสร้างใหม่ได้
    expect(statusOf(db, "new")).toBe("GENERATED");
  });

  it("[P2] auto-posted row (fbPostId มีค่า) → stale ไม่ถูก manual-mark กลืน", () => {
    const db = createContentDb(":memory:");
    // จำลอง row ที่ publish ผ่าน auto path สำเร็จ (POSTED + fbPostId)
    db.insert(contentPosts)
      .values({ id: "auto", templateId: "daily-7", inputData: { targetDate: "2026-06-24" }, status: "POSTED", fbPostId: "fb_123", postedAt: new Date() })
      .run();
    expect(markPostedManual(db, "auto")).toBe("stale"); // ไม่ใช่ replay ของ manual → ไม่คืน ok
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, "auto")).get();
    expect(row!.fbPostId).toBe("fb_123"); // ไม่ถูกแตะ
  });

  it("non-GENERATED (CANCELED / ghost id) → stale ไม่แตะ", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "c", templateId: "daily-7", inputData: { targetDate: "2026-06-22" }, status: "CANCELED" }).run();
    expect(markPostedManual(db, "c")).toBe("stale");
    expect(markPostedManual(db, "ghost")).toBe("stale");
    expect(statusOf(db, "c")).toBe("CANCELED");
  });

  it("ลบ: GENERATED→CANCELED ยังทำงาน (manual delete)", () => {
    const db = createContentDb(":memory:");
    genDaily7(db, "d", "2026-06-23");
    expect(tryTransition(db, "d", "GENERATED", "CANCELED")).toBe(true);
    expect(statusOf(db, "d")).toBe("CANCELED");
  });

  it("[P1.4] auto path เดิม GENERATED→APPROVED→PUBLISHING→POSTED ไม่ regress", () => {
    expect(canTransition("GENERATED", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "PUBLISHING")).toBe(true);
    expect(canTransition("PUBLISHING", "POSTED")).toBe(true);
    // และ manual transition ใหม่ก็ allowed จาก GENERATED
    expect(canTransition("GENERATED", "POSTED")).toBe(true);
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
