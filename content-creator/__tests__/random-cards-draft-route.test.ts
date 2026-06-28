import { describe, it, expect, beforeEach, vi } from "vitest";

const mockGenObject = vi.hoisted(() => vi.fn());
const dbHolder = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("@/content-creator/lib/gemini", () => ({ genObject: mockGenObject }));
vi.mock("@/content-creator/db/client", async (orig) => {
  const actual = await orig<typeof import("@/content-creator/db/client")>();
  return { ...actual, getContentDb: () => dbHolder.db };
});

import { createContentDb } from "@/content-creator/db/client";
import { POST as createDraft } from "@/app/content-creator/api/cards/draft/route";

const req = (body: unknown) =>
  new Request("http://t/content-creator/api/cards/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  process.env.CONTENT_CREATOR_ENABLED = "true";
  dbHolder.db = createContentDb(":memory:");
  mockGenObject.mockReset().mockResolvedValue({ quote: "เปลี่ยนแปลงสู่สิ่งที่ดี", body: "ช่วงนี้มีพลังบวกเข้ามา จงเชื่อมั่น" });
});

describe("POST /api/cards/draft regression [failed draft recovery]", () => {
  it("Gemini ล้ม → 200 ok:false + definitive FAILED + draft/error เพื่อให้ UI recover ได้", async () => {
    mockGenObject.mockRejectedValue(new Error("API key missing"));
    const res = await createDraft(req({ requestKey: "rk-fail" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.definitive).toBe(true);
    expect(body.status).toBe("FAILED");
    expect(body.error).toContain("API key missing");
    expect(body.draft.status).toBe("FAILED");
    expect(body.draft.error).toContain("API key missing");
  });
});
