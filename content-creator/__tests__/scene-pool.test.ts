import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createContentDb, type ContentDb } from "../db/client";
import { sceneLibrary } from "../db/schema";
import { approveScene, rejectScene, retireScene, pickApprovedScene, listScenes, countApproved } from "../scene-pool";
import { buildImageProviderOptions } from "../lib/gemini";

const REF = "content-creator/brand/mimi-reference.png"; // ไฟล์จริง readable (สำหรับ pick อ่าน bytes)
function insertScene(db: ContentDb, id: string, status: string, imagePath = REF) {
  db.insert(sceneLibrary).values({ id, theme: "t", imagePath, status: status as never, genBatch: "b1" }).run();
}
const statusOf = (db: ContentDb, id: string) => db.select().from(sceneLibrary).where(eq(sceneLibrary.id, id)).get()?.status;

let db: ContentDb;
beforeEach(() => { db = createContentDb(":memory:"); });

describe("scene-pool status transitions [PR#105 ก้อน1-4]", () => {
  it("approve PENDING→APPROVED (+approvedAt) ; reject PENDING→REJECTED", () => {
    insertScene(db, "p", "PENDING");
    expect(approveScene(db, "p")).toBe(true);
    const row = db.select().from(sceneLibrary).where(eq(sceneLibrary.id, "p")).get();
    expect(row?.status).toBe("APPROVED");
    expect(row?.approvedAt).not.toBeNull();
    insertScene(db, "r", "PENDING");
    expect(rejectScene(db, "r")).toBe(true);
    expect(statusOf(db, "r")).toBe("REJECTED");
  });

  it("retire APPROVED→RETIRED (+retiredAt) ; เก็บไฟล์ (Nothing is Deleted)", () => {
    insertScene(db, "a", "APPROVED");
    expect(retireScene(db, "a")).toBe(true);
    const row = db.select().from(sceneLibrary).where(eq(sceneLibrary.id, "a")).get();
    expect(row?.status).toBe("RETIRED");
    expect(row?.retiredAt).not.toBeNull();
    expect(row?.imagePath).toBe(REF); // ไฟล์ยังอยู่
  });

  it("transition guard: ไม่กลับทาง — approve non-PENDING / retire non-APPROVED → false (ไม่เปลี่ยน)", () => {
    insertScene(db, "a", "APPROVED");
    expect(approveScene(db, "a")).toBe(false); // APPROVED แล้ว approve ซ้ำไม่ได้
    expect(rejectScene(db, "a")).toBe(false); // reject ได้เฉพาะ PENDING
    insertScene(db, "p", "PENDING");
    expect(retireScene(db, "p")).toBe(false); // retire ได้เฉพาะ APPROVED
    expect(statusOf(db, "p")).toBe("PENDING"); // ไม่ถูกแตะ
    insertScene(db, "ret", "RETIRED");
    expect(retireScene(db, "ret")).toBe(false); // RETIRED terminal
  });
});

describe("pickApprovedScene [ก้อน 4 — exclude RETIRED/PENDING/REJECTED]", () => {
  it("สุ่มจาก APPROVED เท่านั้น — มี RETIRED/PENDING/REJECTED ปนก็ไม่หยิบ", () => {
    insertScene(db, "approved", "APPROVED");
    insertScene(db, "retired", "RETIRED");
    insertScene(db, "pending", "PENDING");
    insertScene(db, "rejected", "REJECTED");
    // pick 10 รอบ → ต้องได้ bytes (จาก approved ตัวเดียว) ทุกรอบ ไม่ throw
    for (let i = 0; i < 10; i++) expect(pickApprovedScene(db).length).toBeGreaterThan(1000);
  });

  it("ไม่มี APPROVED (มีแต่ RETIRED/PENDING) → throw fail loud 'gen batch first'", () => {
    insertScene(db, "retired", "RETIRED");
    insertScene(db, "pending", "PENDING");
    expect(() => pickApprovedScene(db)).toThrow(/approved scene|gen batch/);
  });
});

describe("list / count", () => {
  it("listScenes(status) filter + countApproved count(*) เฉพาะ APPROVED (exclude RETIRED) [P2]", () => {
    insertScene(db, "p1", "PENDING");
    insertScene(db, "p2", "PENDING");
    insertScene(db, "a1", "APPROVED");
    insertScene(db, "a2", "APPROVED");
    insertScene(db, "ret", "RETIRED");
    expect(listScenes(db, "PENDING")).toHaveLength(2);
    expect(listScenes(db)).toHaveLength(5);
    expect(countApproved(db)).toBe(2); // นับเฉพาะ APPROVED — RETIRED ไม่นับ
  });
});

describe("[P2] genImageWithRef aspectRatio — backward-compat", () => {
  it("ไม่ส่ง aspectRatio → providerOptions.google ไม่มี imageConfig (behavior เดิม)", () => {
    const o = buildImageProviderOptions();
    expect(o.google.responseModalities).toEqual(["TEXT", "IMAGE"]);
    expect("imageConfig" in o.google).toBe(false);
  });
  it("ส่ง '1:1' → imageConfig.aspectRatio = '1:1'", () => {
    const o = buildImageProviderOptions("1:1") as { google: { imageConfig?: { aspectRatio: string } } };
    expect(o.google.imageConfig?.aspectRatio).toBe("1:1");
  });
});
