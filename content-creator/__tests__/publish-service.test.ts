import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpload = vi.hoisted(() => vi.fn());
const mockPublish = vi.hoisted(() => vi.fn());
vi.mock("../lib/facebook", () => ({ uploadUnpublishedPhoto: mockUpload, publishToFeed: mockPublish }));

import { eq } from "drizzle-orm";
import { createContentDb, type ContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { publishApprovedPost } from "../publish-service";

const TODAY = "2026-06-16";
const deps = { pageId: "p", token: "t", today: TODAY };

let db: ContentDb;
let n = 0;
beforeEach(() => {
  db = createContentDb(":memory:");
  mockUpload.mockReset().mockResolvedValue("media-1");
  mockPublish.mockReset().mockResolvedValue("post-1");
  n = 0;
});

function approvedDaily7(targetDate: string, opts: { mediaFbid?: string | null } = {}): string {
  const id = `d7-${n++}`;
  db.insert(contentPosts)
    .values({ id, templateId: "daily-7", inputData: { targetDate, days: [] }, status: "APPROVED", caption: "cap", imagePath: "/m/y.png", mediaFbid: opts.mediaFbid === undefined ? "m1" : opts.mediaFbid })
    .run();
  return id;
}
const statusOf = (id: string) => db.select().from(contentPosts).where(eq(contentPosts.id, id)).get()?.status;

describe("publish-service — per-day fence + point-of-no-return [S4b ตู๋ P1]", () => {
  it("two rows same day → row 2 SKIPPED (per-day fence) ; ยิง FB ครั้งเดียว", async () => {
    const a = approvedDaily7(TODAY);
    const b = approvedDaily7(TODAY);
    const r1 = await publishApprovedPost(db, a, deps);
    const r2 = await publishApprovedPost(db, b, deps);
    expect(r1.status).toBe("POSTED");
    expect(r2.status).toBe("SKIPPED"); // fence ชน (a อยู่ POSTED วันเดียวกัน)
    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(statusOf(b)).toBe("APPROVED"); // b ไม่ถูกแตะ (claim ไม่ผ่าน fence)
  });

  it("two workers same row → ครั้งที่ 2 SKIPPED (ไม่โพสต์ซ้ำ)", async () => {
    const a = approvedDaily7(TODAY);
    const r1 = await publishApprovedPost(db, a, deps);
    const r2 = await publishApprovedPost(db, a, deps);
    expect(r1.status).toBe("POSTED");
    expect(r2.status).toBe("SKIPPED"); // ไม่ใช่ APPROVED แล้ว
    expect(mockPublish).toHaveBeenCalledTimes(1);
  });

  it("staleness: targetDate เลยวัน → STALE ไม่ claim/ไม่ยิง FB", async () => {
    const r = await publishApprovedPost(db, approvedDaily7("2026-06-15"), deps);
    expect(r.status).toBe("STALE");
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("future targetDate → STALE (no-op)", async () => {
    const r = await publishApprovedPost(db, approvedDaily7("2026-06-17"), deps);
    expect(r.status).toBe("STALE");
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("pre-feed fail (upload) → RETRYABLE + release→APPROVED (ยังไม่ยิง FB)", async () => {
    const a = approvedDaily7(TODAY, { mediaFbid: null }); // ต้อง upload → safeResolve หาไฟล์ไม่เจอ → throw ก่อนยิง feed
    const r = await publishApprovedPost(db, a, deps);
    expect(r.status).toBe("RETRYABLE");
    expect(statusOf(a)).toBe("APPROVED"); // release กลับ retry ได้
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("post-feed ambiguous (publishToFeed throw) → AMBIGUOUS คง PUBLISHING (ห้าม release/retry)", async () => {
    mockPublish.mockRejectedValueOnce(new Error("network timeout"));
    const a = approvedDaily7(TODAY);
    const r = await publishApprovedPost(db, a, deps);
    expect(r.status).toBe("AMBIGUOUS");
    expect(statusOf(a)).toBe("PUBLISHING"); // ไม่ release (กันโพสต์ซ้ำ)
  });

  it("ไม่ใช่ APPROVED → SKIPPED", async () => {
    const id = "g1";
    db.insert(contentPosts).values({ id, templateId: "daily-7", inputData: { targetDate: TODAY }, status: "GENERATED", caption: "c", imagePath: "/m/y.png" }).run();
    expect((await publishApprovedPost(db, id, deps)).status).toBe("SKIPPED");
  });
});
