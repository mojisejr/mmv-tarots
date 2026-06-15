import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createContentDb, type ContentDb } from "../db/client";
import { contentDrafts, contentPosts } from "../db/schema";
import {
  createDraft,
  completeDraftGen,
  failDraftGen,
  editDraft,
  claimRegen,
  finalizeDraft,
  getDraft,
  DraftConflictError,
  DraftStaleError,
} from "../db/drafts";

const SEED = { targetDate: "2026-06-15" };
const FINAL = { targetDate: "2026-06-15", backgroundId: "x", days: [] as unknown[] };

let db: ContentDb;
beforeEach(() => {
  db = createContentDb(":memory:");
});

/** helper: สร้าง draft แล้ว complete เป็น READY (จำลอง gen สำเร็จ) → คืน draft READY */
function readyDraft(requestKey = "rk-1") {
  const { draft, token } = createDraft(db, { requestKey, templateId: "daily-7", seedPayload: SEED });
  completeDraftGen(db, draft.id, token!, { ...SEED, days: [{ day: "จันทร์", fortune: "x" }] });
  return getDraft(db, draft.id)!;
}

describe("createDraft idempotency [S6c ตู๋ P1.A]", () => {
  it("fresh insert → fresh+token, status GENERATING", () => {
    const r = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(r.fresh).toBe(true);
    expect(r.token).toBeTruthy();
    expect(r.draft.status).toBe("GENERATING");
  });
  it("requestKey เดิม + payload ตรง → idempotent (fresh=false, draft เดิม, ไม่ gen ซ้ำ)", () => {
    const a = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    const b = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(b.fresh).toBe(false);
    expect(b.token).toBeNull();
    expect(b.draft.id).toBe(a.draft.id);
  });
  it("requestKey เดิม + payload ต่าง → 409 DraftConflictError", () => {
    createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(() => createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: { targetDate: "2026-12-31" } })).toThrow(DraftConflictError);
  });
});

describe("completeDraftGen/failDraftGen token guard", () => {
  it("token ตรง → READY + revision bump + draftData", () => {
    const { draft, token } = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(completeDraftGen(db, draft.id, token!, { days: 7 })).toBe(true);
    const d = getDraft(db, draft.id)!;
    expect(d.status).toBe("READY");
    expect(d.revision).toBe(1);
  });
  it("token ผิด → false (ไม่ทับ — superseded)", () => {
    const { draft } = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(completeDraftGen(db, draft.id, "wrong-token", { days: 7 })).toBe(false);
    expect(getDraft(db, draft.id)!.status).toBe("GENERATING");
  });
  it("fail token ตรง → FAILED + error", () => {
    const { draft, token } = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(failDraftGen(db, draft.id, token!, "boom")).toBe(true);
    expect(getDraft(db, draft.id)!.status).toBe("FAILED");
  });
});

describe("editDraft optimistic concurrency", () => {
  it("revision ตรง (READY) → bump + อัปเดต draftData", () => {
    const d = readyDraft();
    const after = editDraft(db, d.id, d.revision, { ...SEED, days: [{ day: "อังคาร", fortune: "y" }] });
    expect(after.revision).toBe(d.revision + 1);
  });
  it("revision ไม่ตรง → DraftStaleError (กัน lost-update)", () => {
    const d = readyDraft();
    expect(() => editDraft(db, d.id, d.revision + 5, { x: 1 })).toThrow(DraftStaleError);
  });
  it("ไม่ใช่ READY (GENERATING) → DraftStaleError", () => {
    const { draft } = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(() => editDraft(db, draft.id, draft.revision, { x: 1 })).toThrow(DraftStaleError);
  });
});

describe("claimRegen [ตู๋ P1.D]", () => {
  it("READY + revision ตรง → claim (token, GENERATING, attemptKey, revision bump)", () => {
    const d = readyDraft();
    const r = claimRegen(db, d.id, "attempt-1", d.revision);
    expect(r.replay).toBe(false);
    expect(r.token).toBeTruthy();
    expect(r.draft.status).toBe("GENERATING");
    expect(r.draft.revision).toBe(d.revision + 1);
  });
  it("attemptKey เดิม → replay (token null, ไม่ claim ซ้ำ)", () => {
    const d = readyDraft();
    claimRegen(db, d.id, "attempt-1", d.revision);
    const replay = claimRegen(db, d.id, "attempt-1", d.revision + 1);
    expect(replay.replay).toBe(true);
    expect(replay.token).toBeNull();
  });
  it("revision ไม่ตรง → DraftStaleError", () => {
    const d = readyDraft();
    expect(() => claimRegen(db, d.id, "attempt-1", d.revision + 9)).toThrow(DraftStaleError);
  });
  it("stale regen เก่า complete ไม่ทับ attempt ใหม่ (token ใหม่ชนะ)", () => {
    const d = readyDraft();
    const first = claimRegen(db, d.id, "attempt-1", d.revision); // token T1, GENERATING
    // จำลอง lease หมดอายุ (gen T1 ค้าง) → set generatingAt ย้อนหลัง
    db.update(contentDrafts).set({ generatingAt: new Date(Date.now() - 10 * 60 * 1000) }).where(eq(contentDrafts.id, d.id)).run();
    const second = claimRegen(db, d.id, "attempt-2", 0); // ยึดผ่าน stale lease → token T2
    expect(second.token).toBeTruthy();
    // T1 (เก่า) complete ทีหลัง → ต้องไม่ทับ
    expect(completeDraftGen(db, d.id, first.token!, { stale: true })).toBe(false);
    expect(completeDraftGen(db, d.id, second.token!, { fresh: true })).toBe(true);
    expect(getDraft(db, d.id)!.draftData).toEqual({ fresh: true });
  });
});

describe("finalizeDraft atomic + double-finalize guard [ตู๋ P1.A]", () => {
  it("READY + revision ตรง → สร้าง contentPost PENDING + draft FINALIZED", () => {
    const d = readyDraft();
    const r = finalizeDraft(db, d.id, "fk-1", d.revision, FINAL, "daily-7");
    expect(r.replay).toBe(false);
    const post = db.select().from(contentPosts).where(eq(contentPosts.id, r.contentPostId)).get();
    expect(post?.status).toBe("PENDING");
    expect(post?.requestKey).toBe(`draft:${d.id}`);
    expect(getDraft(db, d.id)!.status).toBe("FINALIZED");
  });
  it("replay finalizeKey เดิม → contentPostId เดิม (ไม่สร้าง post ซ้ำ)", () => {
    const d = readyDraft();
    const a = finalizeDraft(db, d.id, "fk-1", d.revision, FINAL, "daily-7");
    const b = finalizeDraft(db, d.id, "fk-1", d.revision + 1, FINAL, "daily-7");
    expect(b.replay).toBe(true);
    expect(b.contentPostId).toBe(a.contentPostId);
    expect(db.select().from(contentPosts).all().length).toBe(1);
  });
  it("double-finalize ด้วย finalizeKey ใหม่ → DraftConflictError", () => {
    const d = readyDraft();
    finalizeDraft(db, d.id, "fk-1", d.revision, FINAL, "daily-7");
    expect(() => finalizeDraft(db, d.id, "fk-2", 99, FINAL, "daily-7")).toThrow(DraftConflictError);
  });
  it("revision ไม่ตรง → DraftStaleError (ไม่สร้าง post)", () => {
    const d = readyDraft();
    expect(() => finalizeDraft(db, d.id, "fk-1", d.revision + 7, FINAL, "daily-7")).toThrow(DraftStaleError);
    expect(db.select().from(contentPosts).all().length).toBe(0);
  });
  it("ไม่ใช่ READY → DraftStaleError", () => {
    const { draft } = createDraft(db, { requestKey: "rk", templateId: "daily-7", seedPayload: SEED });
    expect(() => finalizeDraft(db, draft.id, "fk-1", draft.revision, FINAL, "daily-7")).toThrow(DraftStaleError);
  });
});
