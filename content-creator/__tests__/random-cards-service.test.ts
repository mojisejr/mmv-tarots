import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";

const mockGenObject = vi.hoisted(() => vi.fn());
vi.mock("../lib/gemini", () => ({ genObject: mockGenObject }));

import { createContentDb, type ContentDb } from "../db/client";
import { contentPosts, sceneLibrary } from "../db/schema";
import { getDraft } from "../db/drafts";
import { createRandomCardsDraft, regenRandomCardsDraft, finalizeRandomCardsDraft } from "../random-cards-service";

const reading = () => ({ quote: "เปลี่ยนแปลงสู่สิ่งที่ดี", body: "ช่วงนี้มีพลังบวกเข้ามา จงเชื่อมั่น" });
// finalize ต้องมี approved scene (preflight) — helper เพิ่ม 1 ใบ
const approveScene = (db: ContentDb) =>
  db.insert(sceneLibrary).values({ id: crypto.randomUUID(), theme: "t", imagePath: "content-creator/brand/mimi-reference.png", status: "APPROVED", genBatch: "b" }).run();

let db: ContentDb;
beforeEach(() => {
  db = createContentDb(":memory:");
  mockGenObject.mockReset().mockResolvedValue(reading());
});

describe("createRandomCardsDraft [PR#103]", () => {
  it("fresh → จั่ว 3 ใบ unique + ตีความ → READY", async () => {
    const d = await createRandomCardsDraft(db, "rk");
    expect(d.status).toBe("READY");
    const dd = d.draftData as { cardIds: string[]; quote: string; body: string };
    expect(dd.cardIds).toHaveLength(3);
    expect(new Set(dd.cardIds).size).toBe(3); // unique
    expect(dd.quote).toBeTruthy();
    expect(mockGenObject).toHaveBeenCalledTimes(1);
  });

  it("retry requestKey เดิม → ไพ่/ตีความเดิม (idempotent, ไม่ gen ซ้ำ)", async () => {
    const a = await createRandomCardsDraft(db, "rk");
    const b = await createRandomCardsDraft(db, "rk");
    expect((b.draftData as { cardIds: string[] }).cardIds).toEqual((a.draftData as { cardIds: string[] }).cardIds);
    expect(mockGenObject).toHaveBeenCalledTimes(1);
  });

  it("ตีความยาวเกิน → regen 1 ครั้ง → ยังเกิน → FAILED", async () => {
    mockGenObject.mockResolvedValue({ quote: "x".repeat(200), body: "y" }); // quote เกิน 160
    const d = await createRandomCardsDraft(db, "rk");
    expect(d.status).toBe("FAILED");
    expect(mockGenObject).toHaveBeenCalledTimes(2); // gen + regen-once
  });
});

describe("regen + finalize", () => {
  it("regen attemptKey ใหม่ → ไพ่ชุดใหม่ (สุ่มใหม่)", async () => {
    const a = await createRandomCardsDraft(db, "rk");
    const after = await regenRandomCardsDraft(db, a.id, "attempt-1", a.revision);
    expect(after.status).toBe("READY");
    // seed ต่าง (draft.id vs attemptKey) → โอกาสสูงมากที่ไพ่ต่าง ; อย่างน้อย gen ถูกเรียกอีก
    expect(mockGenObject).toHaveBeenCalledTimes(2);
  });

  it("[ตู๋/บอง P1] no approved scene → finalize throw (DraftConflictError) + draft คง READY + ไม่สร้าง contentPost", async () => {
    const d = await createRandomCardsDraft(db, "rk"); // ไม่มี approved scene
    expect(() => finalizeRandomCardsDraft(db, d.id, "fk", d.revision)).toThrow(/approved scene|scenes/);
    expect(getDraft(db, d.id)!.status).toBe("READY"); // ไม่ lock
    expect(db.select().from(contentPosts).all()).toHaveLength(0); // ไม่สร้าง post (ไม่จ่าย caption/image)
  });

  it("finalize → contentPost PENDING + persist cardIds/quote/body", async () => {
    const d = await createRandomCardsDraft(db, "rk");
    approveScene(db);
    const res = finalizeRandomCardsDraft(db, d.id, "fk", d.revision);
    const post = db.select().from(contentPosts).where(eq(contentPosts.id, res.contentPostId)).get();
    expect(post?.status).toBe("PENDING");
    expect(post?.templateId).toBe("random-cards");
    const input = post?.inputData as { cardIds: string[]; quote: string; body: string };
    expect(input.cardIds).toEqual((d.draftData as { cardIds: string[] }).cardIds); // ไพ่ persist เดิม
    expect(getDraft(db, d.id)!.status).toBe("FINALIZED");
  });

  it("[ตู๋ P1 reload] finalize replay (finalizeKey เดิม หลัง FINALIZED) → contentPost เดิม ไม่สร้างซ้ำ", async () => {
    const d = await createRandomCardsDraft(db, "rk");
    approveScene(db);
    const first = finalizeRandomCardsDraft(db, d.id, "fk", d.revision);
    // จำลอง reload → POST finalize ซ้ำด้วย key เดิม (draft FINALIZED แล้ว) → ต้องคืน post เดิม (idempotent)
    const replay = finalizeRandomCardsDraft(db, d.id, "fk", d.revision);
    expect(replay.contentPostId).toBe(first.contentPostId);
    expect(replay.replay).toBe(true);
    expect(db.select().from(contentPosts).all()).toHaveLength(1); // ไม่มี post ซ้ำ
  });
});
