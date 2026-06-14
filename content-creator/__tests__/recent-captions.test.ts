import { describe, it, expect } from "vitest";
import { createContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { getRecentCaptions } from "../engine";

describe("getRecentCaptions [ตู๋ P2] — anti-repeat = POSTED จริง เรียง postedAt", () => {
  it("คืนเฉพาะ POSTED (ไม่เอา CANCELED/GENERATED) เรียง postedAt ล่าสุดก่อน", () => {
    const db = createContentDb(":memory:");
    const ins = (id: string, status: string, caption: string, postedAt: Date | null) =>
      db.insert(contentPosts).values({ id, templateId: "t", inputData: {}, status: status as never, caption, postedAt }).run();
    ins("p1", "POSTED", "โพสต์เก่า", new Date(1000));
    ins("p2", "POSTED", "โพสต์ใหม่", new Date(2000));
    ins("c1", "CANCELED", "ยกเลิก", null); // ไม่นับ
    ins("g1", "GENERATED", "ร่างในคิว", null); // ไม่นับ
    expect(getRecentCaptions(db, "ignore")).toEqual(["โพสต์ใหม่", "โพสต์เก่า"]);
  });

  it("exclude self id + ไม่มี POSTED → ว่าง", () => {
    const db = createContentDb(":memory:");
    db.insert(contentPosts).values({ id: "self", templateId: "t", inputData: {}, status: "POSTED", caption: "ตัวเอง", postedAt: new Date() }).run();
    expect(getRecentCaptions(db, "self")).toEqual([]);
  });
});
