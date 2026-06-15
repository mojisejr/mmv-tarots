import { describe, it, expect, beforeEach, vi } from "vitest";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;

const mockGenObject = vi.hoisted(() => vi.fn());
const dbHolder = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("@/content-creator/lib/gemini", () => ({ genObject: mockGenObject }));
vi.mock("@/content-creator/db/client", async (orig) => {
  const actual = await orig<typeof import("@/content-creator/db/client")>();
  return { ...actual, getContentDb: () => dbHolder.db };
});

import { createContentDb } from "@/content-creator/db/client";
import { POST as createDraft } from "@/app/content-creator/api/daily/draft/route";
import { GET as getDraftRoute, PATCH as patchDraftRoute } from "@/app/content-creator/api/daily/draft/[id]/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const patchReq = (body: unknown) => new Request("http://t", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const req = (body: unknown) =>
  new Request("http://t/content-creator/api/daily/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  process.env.CONTENT_CREATOR_ENABLED = "true";
  dbHolder.db = createContentDb(":memory:");
  mockGenObject.mockReset();
  mockGenObject.mockResolvedValue({ days: WEEKDAYS.map((day) => ({ day, fortune: `${day} ดี` })) });
});

describe("POST /api/daily/draft regression [ตู๋ P1.1/P1.3]", () => {
  it("ไม่ส่ง targetDate → 400 (require client-frozen, ไม่ derive today)", async () => {
    const res = await createDraft(req({ requestKey: "rk" }));
    expect(res.status).toBe(400);
    expect(mockGenObject).not.toHaveBeenCalled();
  });

  it("targetDate ไม่ใช่วันปฏิทินจริง (2026-99-99) → 400 (ก่อนจ่าย Gemini)", async () => {
    const res = await createDraft(req({ requestKey: "rk", targetDate: "2026-99-99" }));
    expect(res.status).toBe(400);
    expect(mockGenObject).not.toHaveBeenCalled();
  });

  it("valid → 200 READY ; retry key เดิ่ม payload ตรง → idempotent (ไม่ gen ซ้ำ)", async () => {
    const a = await createDraft(req({ requestKey: "rk", targetDate: "2026-06-15" }));
    const aj = await a.json();
    expect(a.status).toBe(200);
    expect(aj.draft.status).toBe("READY");

    const b = await createDraft(req({ requestKey: "rk", targetDate: "2026-06-15" }));
    const bj = await b.json();
    expect(bj.draft.id).toBe(aj.draft.id);
    expect(mockGenObject).toHaveBeenCalledTimes(1); // retry ไม่ gen ซ้ำ
  });

  it("key เดิ่ม + targetDate ต่าง → 409 (key reuse, ไม่ idempotent ผิด ๆ)", async () => {
    await createDraft(req({ requestKey: "rk", targetDate: "2026-06-15" }));
    const res = await createDraft(req({ requestKey: "rk", targetDate: "2026-12-31" }));
    expect(res.status).toBe(409);
  });
});

describe("GET/PATCH draft route [S6c.2 — restore + optimistic]", () => {
  async function makeDraft() {
    const r = await (await createDraft(req({ requestKey: "rk", targetDate: "2026-06-15" }))).json();
    return r.draft as { id: string; revision: number };
  }

  it("GET → คืน draft (restore session)", async () => {
    const d = await makeDraft();
    const res = await getDraftRoute(new Request("http://t"), ctx(d.id));
    expect(res.status).toBe(200);
    expect((await res.json()).draft.id).toBe(d.id);
  });
  it("GET id มั่ว → 404", async () => {
    expect((await getDraftRoute(new Request("http://t"), ctx("nope"))).status).toBe(404);
  });
  it("PATCH revision ตรง → 200 + bump ; revision เก่า → 409", async () => {
    const d = await makeDraft();
    const ok = await patchDraftRoute(patchReq({ expectedRevision: d.revision, days: [{ day: "จันทร์", fortune: "แก้" }] }), ctx(d.id));
    expect(ok.status).toBe(200);
    const stale = await patchDraftRoute(patchReq({ expectedRevision: d.revision, days: [{ day: "อังคาร", fortune: "y" }] }), ctx(d.id));
    expect(stale.status).toBe(409);
  });
  it("PATCH วันซ้ำ → 400 (bounded workspace)", async () => {
    const d = await makeDraft();
    const res = await patchDraftRoute(patchReq({ expectedRevision: d.revision, days: [{ day: "จันทร์", fortune: "a" }, { day: "จันทร์", fortune: "b" }] }), ctx(d.id));
    expect(res.status).toBe(400);
  });
});
