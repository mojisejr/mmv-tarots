import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";

const mockGenObject = vi.hoisted(() => vi.fn());
vi.mock("../lib/gemini", () => ({ genObject: mockGenObject }));

import { createContentDb, type ContentDb } from "../db/client";
import { contentPosts, contentDrafts } from "../db/schema";
import { createDraft, getDraft } from "../db/drafts";
import {
  createGenericDraft,
  finalizeGenericDraft,
  classifyGenericStatus,
  isStaleGenerating,
  genericDraftErrorStatus,
  InvalidTypeError,
  STALE_GENERATING_MS,
} from "../generic-service";
import { GENERIC_TEMPLATE_ID } from "../templates/generic";
import { DraftConflictError } from "../db/drafts";
import type { ContentStatus } from "../db/schema";

const valid = () => ({ title: "ดวงวันนี้", blocks: [{ label: "คำตอบ", text: "ใช่เลย", emphasis: "hero" as const }, { text: "พลังบวกมา" }] });

let db: ContentDb;
beforeEach(() => {
  db = createContentDb(":memory:");
  mockGenObject.mockReset();
  mockGenObject.mockResolvedValue(valid());
});

describe("createGenericDraft fence [too P1.1 — no double-pay]", () => {
  it("fresh → resolve → READY ; templateId lock = generic [P1.2 unknown template impossible]", async () => {
    const d = await createGenericDraft(db, "rk", "yes-no");
    expect(d.status).toBe("READY");
    expect(d.templateId).toBe(GENERIC_TEMPLATE_ID);
    expect((d.draftData as { title: string }).title).toBe("ดวงวันนี้");
    expect(mockGenObject).toHaveBeenCalledTimes(1);
  });

  it("retry requestKey เดิม + type เดิม → genObject ครั้งเดียว (idempotent)", async () => {
    await createGenericDraft(db, "rk", "yes-no");
    await createGenericDraft(db, "rk", "yes-no");
    expect(mockGenObject).toHaveBeenCalledTimes(1);
  });

  it("concurrent-ish: requestKey เดียวกัน 2 ครั้ง → resolve ครั้งเดียว", async () => {
    const [a, b] = await Promise.all([createGenericDraft(db, "rk", "yes-no"), createGenericDraft(db, "rk", "yes-no")]);
    expect(a.id).toBe(b.id);
    expect(mockGenObject).toHaveBeenCalledTimes(1);
  });

  it("whitespace/case variant ของ type + key เดิม → ไม่ 409 หลอก (canonical stable) [too P2]", async () => {
    await createGenericDraft(db, "rk", "Yes-No");
    const again = await createGenericDraft(db, "rk", "  yes-no  ");
    expect(again.status).toBe("READY");
    expect(mockGenObject).toHaveBeenCalledTimes(1); // reuse — ไม่ gen ซ้ำ
  });

  it("same key + type ต่างจริง → DraftConflictError (409)", async () => {
    await createGenericDraft(db, "rk", "yes-no");
    await expect(createGenericDraft(db, "rk", "ดวงการเงิน")).rejects.toBeInstanceOf(DraftConflictError);
    expect(genericDraftErrorStatus(new DraftConflictError("x")).status).toBe(409);
  });

  it("type ว่าง → InvalidTypeError (400)", async () => {
    await expect(createGenericDraft(db, "rk", "   ")).rejects.toBeInstanceOf(InvalidTypeError);
    expect(genericDraftErrorStatus(new InvalidTypeError("x")).status).toBe(400);
  });

  it("resolve ล้ม (gibberish ทั้ง 2 รอบ) → draft FAILED (fail loud)", async () => {
    mockGenObject.mockResolvedValue({ title: "t", blocks: [{ text: "   " }] });
    const d = await createGenericDraft(db, "rk", "???");
    expect(d.status).toBe("FAILED");
    expect(mockGenObject).toHaveBeenCalledTimes(2); // gen + repair
  });
});

describe("finalizeGenericDraft", () => {
  it("READY → contentPost PENDING (templateId generic, inputData มี content + meta)", async () => {
    mockGenObject.mockResolvedValue({ title: "ก", blocks: [{ text: "ดีนะ" }] }); // lowConf (title สั้น)
    const d = await createGenericDraft(db, "rk", "ab");
    const res = finalizeGenericDraft(db, d.id, `gen:${d.id}`, d.revision);
    const post = db.select().from(contentPosts).where(eq(contentPosts.id, res.contentPostId)).get();
    expect(post?.status).toBe("PENDING");
    expect(post?.templateId).toBe(GENERIC_TEMPLATE_ID);
    expect((post?.inputData as { title: string }).title).toBe("ก");
    expect((post?.inputData as { meta?: { lowConf?: boolean } }).meta?.lowConf).toBe(true); // persist → คิวโชว์ได้
    expect(getDraft(db, d.id)!.status).toBe("FINALIZED");
  });

  it("finalize replay (finalizeKey เดิม) → คืน post เดิม (ไม่สร้างซ้ำ)", async () => {
    const d = await createGenericDraft(db, "rk", "yes-no");
    const r1 = finalizeGenericDraft(db, d.id, `gen:${d.id}`, d.revision);
    const r2 = finalizeGenericDraft(db, d.id, `gen:${d.id}`, getDraft(db, d.id)!.revision);
    expect(r2.contentPostId).toBe(r1.contentPostId);
    expect(r2.replay).toBe(true);
    expect(db.select().from(contentPosts).all()).toHaveLength(1);
  });
});

describe("isStaleGenerating [too P2 — stuck GENERATING recovery]", () => {
  it("GENERATING ที่ generatingAt เก่าเกิน lease → stale=true ; สดใหม่ → false", () => {
    const { draft } = createDraft(db, { requestKey: "rk", templateId: GENERIC_TEMPLATE_ID, seedPayload: { type: "x" } });
    expect(isStaleGenerating(getDraft(db, draft.id)!)).toBe(false); // เพิ่ง claim
    db.update(contentDrafts).set({ generatingAt: new Date(Date.now() - STALE_GENERATING_MS - 1000) }).where(eq(contentDrafts.id, draft.id)).run();
    expect(isStaleGenerating(getDraft(db, draft.id)!)).toBe(true);
  });
});

describe("classifyGenericStatus [§1.1 — FINALIZED อ่าน status จริง]", () => {
  it("GENERATED+ → 200 ok definitive", () => {
    for (const s of ["GENERATED", "APPROVED", "PUBLISHING", "POSTED"] as ContentStatus[]) {
      expect(classifyGenericStatus(s)).toEqual({ http: 200, ok: true, definitive: true });
    }
  });
  it("GENERATING/PENDING → 202 ไม่ definitive", () => {
    expect(classifyGenericStatus("PENDING")).toEqual({ http: 202, ok: false, definitive: false });
    expect(classifyGenericStatus("GENERATING")).toEqual({ http: 202, ok: false, definitive: false });
  });
  it("FAILED/CANCELED → 502 definitive failed", () => {
    expect(classifyGenericStatus("FAILED")).toEqual({ http: 502, ok: false, definitive: true });
    expect(classifyGenericStatus("CANCELED")).toEqual({ http: 502, ok: false, definitive: true });
  });
});
