import { describe, it, expect, beforeEach, vi } from "vitest";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
const dbHolder = vi.hoisted(() => ({ db: null as unknown }));

// generate (engine) บน post ที่ไม่ใช่ PENDING → SKIPPED ทันที (ไม่เรียก Gemini) — mock กัน import พัง
vi.mock("@/content-creator/lib/gemini", () => ({ genObject: vi.fn(), genCaption: vi.fn(), genImage: vi.fn(), genImageWithRef: vi.fn() }));
vi.mock("@/content-creator/db/client", async (orig) => {
  const actual = await orig<typeof import("@/content-creator/db/client")>();
  return { ...actual, getContentDb: () => dbHolder.db };
});

import { createContentDb, type ContentDb } from "@/content-creator/db/client";
import { eq } from "drizzle-orm";
import { contentPosts, type ContentStatus } from "@/content-creator/db/schema";
import { createDraft, completeDraftGen } from "@/content-creator/db/drafts";
import { finalizeDaily7Draft } from "@/content-creator/daily7-service";
import { POST as finalizePOST } from "@/app/content-creator/api/daily/draft/[id]/finalize/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = () => new Request("http://t", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ finalizeKey: "fk", expectedRevision: 0, backgroundId: "mimi-crystal-pastel" }) });

// finalize draft → post (PENDING) แล้วบังคับ status (จำลอง post หลัง gen/หลัง response หาย)
function seedFinalized(rk: string, status: ContentStatus): string {
  const db = dbHolder.db as ContentDb;
  const days = WEEKDAYS.map((d) => ({ day: d, fortune: "x" }));
  const { draft, token } = createDraft(db, { requestKey: rk, templateId: "daily-7", seedPayload: { targetDate: "2026-06-16" } });
  completeDraftGen(db, draft.id, token!, { targetDate: "2026-06-16", days });
  const r = finalizeDaily7Draft(db, draft.id, "fk", 1, "mimi-crystal-pastel");
  db.update(contentPosts).set({ status }).where(eq(contentPosts.id, r.contentPostId)).run();
  return draft.id;
}

beforeEach(() => {
  process.env.CONTENT_CREATOR_ENABLED = "true";
  dbHolder.db = createContentDb(":memory:");
});

describe("finalize route replay classification [ตู๋ P1 — ไม่เหมา SKIPPED=success]", () => {
  it("post GENERATED → replay 200 ok definitive (ไปคิว)", async () => {
    const res = await finalizePOST(req(), ctx(seedFinalized("r1", "GENERATED")));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.definitive).toBe(true);
  });
  it("post GENERATING (กำลัง gen / response หาย) → replay 202 ไม่ definitive", async () => {
    const res = await finalizePOST(req(), ctx(seedFinalized("r2", "GENERATING")));
    expect(res.status).toBe(202);
    expect((await res.json()).definitive).toBe(false);
  });
  it("post FAILED → replay 502 definitive failed (ไม่ใช่ success)", async () => {
    const res = await finalizePOST(req(), ctx(seedFinalized("r3", "FAILED")));
    expect(res.status).toBe(502);
    expect((await res.json()).ok).toBe(false);
  });
});
