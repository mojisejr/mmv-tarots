import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpload = vi.hoisted(() => vi.fn());
const mockPublish = vi.hoisted(() => vi.fn());
vi.mock("../lib/facebook", () => ({ uploadUnpublishedPhoto: mockUpload, publishToFeed: mockPublish }));

import { eq } from "drizzle-orm";
import { createContentDb, type ContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { runSchedulerTick, type ScheduleConfig } from "../scheduler";

const FULL: ScheduleConfig = { days: [0, 1, 2, 3, 4, 5, 6], slots: ["09:00"] };
const deps = (now: string, config: ScheduleConfig = FULL) => ({ pageId: "p", token: "t", config, now: new Date(now) });
// Bangkok = UTC+7
const AFTER_SLOT = "2026-06-16T05:00:00Z"; // Bangkok 12:00 16 มิ.ย.
const BEFORE_SLOT = "2026-06-16T01:00:00Z"; // Bangkok 08:00 16 มิ.ย.
const MIDNIGHT_CROSS = "2026-06-15T17:30:00Z"; // Bangkok 00:30 16 มิ.ย. (UTC ยังเป็น 15)

let db: ContentDb;
let n = 0;
beforeEach(() => {
  db = createContentDb(":memory:");
  mockUpload.mockReset().mockResolvedValue("media-1");
  mockPublish.mockReset().mockResolvedValue("post-1");
  n = 0;
});
function approved(targetDate: string): string {
  const id = `d7-${n++}`;
  db.insert(contentPosts).values({ id, templateId: "daily-7", inputData: { targetDate, days: [] }, status: "APPROVED", caption: "cap", imagePath: "/m/y.png", mediaFbid: "m1" }).run();
  return id;
}
const statusOf = (id: string) => db.select().from(contentPosts).where(eq(contentPosts.id, id)).get()?.status;

describe("scheduler reconcile tick [S4b]", () => {
  it("window closed-time: ก่อนเวลา slot → ไม่โพสต์ (แต่ยัง auto-cancel)", async () => {
    approved("2026-06-16");
    const r = await runSchedulerTick(db, deps(BEFORE_SLOT));
    expect(r.window).toBe("closed-time");
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("window closed-day: วันนี้ไม่อยู่ใน schedule days → ไม่โพสต์", async () => {
    approved("2026-06-16");
    const r = await runSchedulerTick(db, deps(AFTER_SLOT, { days: [], slots: ["09:00"] }));
    expect(r.window).toBe("closed-day");
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("open + มี daily-7 วันนี้ → โพสต์", async () => {
    const a = approved("2026-06-16");
    const r = await runSchedulerTick(db, deps(AFTER_SLOT));
    expect(r.published).toEqual({ id: a, status: "POSTED" });
    expect(statusOf(a)).toBe("POSTED");
  });

  it("catch-up idempotent: tick 2 รอบ → โพสต์ครั้งเดียว (worker ตื่นซ้ำไม่ซ้ำ)", async () => {
    approved("2026-06-16");
    await runSchedulerTick(db, deps(AFTER_SLOT));
    const r2 = await runSchedulerTick(db, deps(AFTER_SLOT));
    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(r2.published?.status ?? r2.note).toBeDefined(); // รอบ 2 ไม่มี APPROVED วันนี้แล้ว (โพสต์ไป) → ว่าง
  });

  it("auto-cancel stale atomic: targetDate เลยวัน → CANCELED ; ของวันนี้ไม่โดน", async () => {
    const stale = approved("2026-06-15");
    const todayPost = approved("2026-06-16");
    const r = await runSchedulerTick(db, deps(AFTER_SLOT));
    expect(r.canceledStale).toBe(1);
    expect(statusOf(stale)).toBe("CANCELED");
    expect(statusOf(todayPost)).not.toBe("CANCELED"); // โพสต์/APPROVED
  });

  it("bangkok-midnight: UTC ยัง 15 แต่ Bangkok เป็น 16 → today=16, ของ 15 stale-cancel (พิสูจน์เส้นวัน Bangkok ไม่ใช่ UTC)", async () => {
    const d15 = approved("2026-06-15");
    const d16 = approved("2026-06-16");
    const r = await runSchedulerTick(db, deps(MIDNIGHT_CROSS));
    expect(r.today).toBe("2026-06-16"); // เส้นวัน Bangkok (ถ้าใช้ UTC จะเป็น 06-15)
    expect(statusOf(d15)).toBe("CANCELED"); // < bangkok-today → stale (ถ้า UTC: 15==today จะไม่ cancel — พิสูจน์ Bangkok)
    expect(statusOf(d16)).toBe("APPROVED"); // ยังไม่ stale + Bangkok 00:30 < slot 09:00 → ยังไม่โพสต์
    expect(r.window).toBe("closed-time");
  });

  it("คิวว่าง: open แต่ไม่มี daily-7 วันนี้ → ไม่โพสต์ (note ว่าง)", async () => {
    const r = await runSchedulerTick(db, deps(AFTER_SLOT));
    expect(r.window).toBe("open");
    expect(r.published).toBeUndefined();
    expect(r.note).toContain("ว่าง");
  });
});
