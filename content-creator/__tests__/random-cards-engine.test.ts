import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";

// mock lib/gemini ทั้งหมด — เช็คว่า genCaption ไม่ถูกเรียกเมื่อไม่มี approved scene [ตู๋/บอง P1b]
const mockGenCaption = vi.hoisted(() => vi.fn());
vi.mock("../lib/gemini", () => ({
  genCaption: mockGenCaption,
  genObject: vi.fn(),
  genImage: vi.fn(),
  genImageWithRef: vi.fn(),
}));

import { createContentDb, type ContentDb } from "../db/client";
import { contentPosts, sceneLibrary } from "../db/schema";
import { updateBrandProfile } from "../db/brand";
import { generate } from "../engine";
import { drawCards } from "../lib/card-pool";

let db: ContentDb;
beforeEach(() => {
  db = createContentDb(":memory:");
  mockGenCaption.mockReset().mockResolvedValue("cap https://maemormimi.com/");
  updateBrandProfile(db, { ctaUrl: "https://maemormimi.com/", refImagePath: "content-creator/brand/mimi-reference.png" });
});

function insertRcPost(id: string) {
  const cardIds = drawCards(id, 3).map((c) => c.id);
  db.insert(contentPosts).values({ id, requestKey: `rk-${id}`, templateId: "random-cards", inputData: { cardIds, quote: "q", body: "b" }, status: "PENDING" }).run();
}

describe("engine hybrid — pickApprovedScene ก่อน genCaption [ตู๋/บอง PR#105 P1b]", () => {
  it("ไม่มี approved scene → FAILED + **ไม่เรียก genCaption** (ไม่เสีย paid caption)", async () => {
    insertRcPost("rc");
    const r = await generate(db, "rc"); // sceneLibrary ว่าง → pickApprovedScene throw ก่อน genCaption
    expect(r.status).toBe("FAILED");
    expect(mockGenCaption).not.toHaveBeenCalled();
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "rc")).get()?.status).toBe("FAILED");
  });

  it("มี approved scene → ผ่าน pickApprovedScene → ถึง genCaption (เรียก 1 ครั้ง)", async () => {
    db.insert(sceneLibrary).values({ id: "s1", theme: "t", imagePath: "content-creator/brand/mimi-reference.png", status: "APPROVED", genBatch: "b" }).run();
    insertRcPost("rc2");
    await generate(db, "rc2");
    expect(mockGenCaption).toHaveBeenCalled(); // pick ผ่าน → ถึง genCaption (ตรงข้ามเคสไม่มี scene)
  });
});
