import { describe, it, expect, beforeEach, vi } from "vitest";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;

// mock เฉพาะ genObject (gen 7 คำทำนาย) — ไม่เรียก Gemini จริงใน test
const mockGenObject = vi.hoisted(() => vi.fn());
vi.mock("../lib/gemini", () => ({ genObject: mockGenObject }));

import { createContentDb, type ContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { eq } from "drizzle-orm";
import { createDaily7Draft, regenDaily7Draft, editDaily7Draft, finalizeDaily7Draft, classifyFinalizeStatus } from "../daily7-service";
import type { ContentStatus } from "../db/schema";
import { getDraft } from "../db/drafts";

const full = () => ({ days: WEEKDAYS.map((day) => ({ day, fortune: `${day} วันนี้ดีมาก` })) });
const VALID_BG = "mimi-crystal-pastel"; // อยู่ใน manifest จริง

let db: ContentDb;
beforeEach(() => {
  db = createContentDb(":memory:");
  mockGenObject.mockReset();
  mockGenObject.mockResolvedValue(full());
});

describe("createDaily7Draft [S6c gen + idempotency]", () => {
  it("fresh → gen 7 วัน → READY", async () => {
    const d = await createDaily7Draft(db, "rk", "2026-06-15");
    expect(d.status).toBe("READY");
    expect((d.draftData as { days: unknown[] }).days).toHaveLength(7);
    expect(mockGenObject).toHaveBeenCalledTimes(1);
  });
  it("retry requestKey เดิม → ไม่ gen ซ้ำ (idempotent)", async () => {
    await createDaily7Draft(db, "rk", "2026-06-15");
    await createDaily7Draft(db, "rk", "2026-06-15");
    expect(mockGenObject).toHaveBeenCalledTimes(1);
  });
  it("gen คืนไม่ครบ 7 → regen 1 ครั้ง → ยังไม่ครบ → FAILED", async () => {
    mockGenObject.mockResolvedValue({ days: WEEKDAYS.slice(0, 6).map((day) => ({ day, fortune: "x" })) });
    const d = await createDaily7Draft(db, "rk", "2026-06-15");
    expect(d.status).toBe("FAILED");
    expect(mockGenObject).toHaveBeenCalledTimes(2); // gen + regen-once
  });
});

describe("regenDaily7Draft", () => {
  it("attemptKey ใหม่ → gen ใหม่ ; days อัปเดต", async () => {
    const d = await createDaily7Draft(db, "rk", "2026-06-15");
    mockGenObject.mockResolvedValue({ days: WEEKDAYS.map((day) => ({ day, fortune: `${day} เปลี่ยนแล้ว` })) });
    const after = await regenDaily7Draft(db, d.id, "attempt-1", d.revision);
    expect(after.status).toBe("READY");
    expect((after.draftData as { days: { fortune: string }[] }).days[0].fortune).toContain("เปลี่ยนแล้ว");
  });
});

describe("classifyFinalizeStatus [ตู๋ P1 replay]", () => {
  it("GENERATED+ → 200 definitive ok", () => {
    for (const s of ["GENERATED", "APPROVED", "PUBLISHING", "POSTED"] as ContentStatus[]) {
      expect(classifyFinalizeStatus(s)).toEqual({ http: 200, ok: true, definitive: true });
    }
  });
  it("GENERATING/PENDING → 202 ไม่ definitive (keep session, ไม่จ่ายซ้ำ)", () => {
    expect(classifyFinalizeStatus("GENERATING")).toEqual({ http: 202, ok: false, definitive: false });
    expect(classifyFinalizeStatus("PENDING")).toEqual({ http: 202, ok: false, definitive: false });
  });
  it("FAILED/CANCELED → 502 definitive failed", () => {
    expect(classifyFinalizeStatus("FAILED")).toEqual({ http: 502, ok: false, definitive: true });
    expect(classifyFinalizeStatus("CANCELED")).toEqual({ http: 502, ok: false, definitive: true });
  });
});

describe("finalizeDaily7Draft validation [ตู๋ P1.A/B]", () => {
  it("valid 7 วัน + backgroundId ใน manifest → สร้าง contentPost PENDING", async () => {
    const d = await createDaily7Draft(db, "rk", "2026-06-15");
    const res = finalizeDaily7Draft(db, d.id, "fk", d.revision, VALID_BG);
    const post = db.select().from(contentPosts).where(eq(contentPosts.id, res.contentPostId)).get();
    expect(post?.status).toBe("PENDING");
    expect((post?.inputData as { backgroundId: string }).backgroundId).toBe(VALID_BG);
    expect((post?.inputData as { targetDate: string }).targetDate).toBe("2026-06-15");
  });
  it("backgroundId ไม่อยู่ใน manifest → throw (กัน render พังตอน gen)", async () => {
    const d = await createDaily7Draft(db, "rk", "2026-06-15");
    expect(() => finalizeDaily7Draft(db, d.id, "fk", d.revision, "ไม่มีจริง")).toThrow(/manifest/);
  });
  it("draftData ไม่ครบ 7 (แก้ให้เหลือ 6) → finalize ไม่ผ่าน (ZodError)", async () => {
    const d = await createDaily7Draft(db, "rk", "2026-06-15");
    const edited = editDaily7Draft(db, d.id, d.revision, WEEKDAYS.slice(0, 6).map((day) => ({ day, fortune: "x" })));
    expect(() => finalizeDaily7Draft(db, d.id, "fk", edited.revision, VALID_BG)).toThrow();
    expect(getDraft(db, d.id)!.status).toBe("READY"); // ไม่ถูก finalize
  });
});
