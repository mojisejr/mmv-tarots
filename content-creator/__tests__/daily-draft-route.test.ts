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
