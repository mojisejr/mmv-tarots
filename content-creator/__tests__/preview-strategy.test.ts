import { describe, it, expect, vi, beforeEach } from "vitest";

// inject composition template เข้า registry (finance ยังของจริง) — preview ต้อง strategy-aware [ตู๋ P2]
vi.mock("@/content-creator/templates", async (orig) => {
  const actual = await orig<typeof import("@/content-creator/templates")>();
  const { z } = await import("zod");
  const comp = {
    id: "comp-prev",
    name: "comp",
    inputSchema: z.object({ x: z.string() }),
    buildCaptionPrompt: () => ({ system: "", prompt: "" }),
    imageStrategy: "composition" as const,
    renderImage: async () => new Uint8Array(),
  };
  return { ...actual, getTemplate: (id: string) => (id === "comp-prev" ? comp : actual.getTemplate(id)) };
});

import { POST as previewPOST } from "@/app/content-creator/api/preview/route";

const req = (body: unknown) =>
  new Request("http://t", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => (process.env.CONTENT_CREATOR_ENABLED = "true"));

describe("[ตู๋ P2] preview strategy-aware", () => {
  it("ai (finance) → imageStrategy=ai + มี imagePrompt", async () => {
    const res = await previewPOST(req({ templateId: "finance-daily", inputData: { card: "The Sun", meaning: "ดี" } }));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.imageStrategy).toBe("ai");
    expect(d.imagePrompt).toBeTruthy();
  });

  it("composition → imageStrategy=composition + ไม่มี imagePrompt (ไม่สมมติ prompt)", async () => {
    const res = await previewPOST(req({ templateId: "comp-prev", inputData: { x: "hi" } }));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.imageStrategy).toBe("composition");
    expect(d.imagePrompt).toBeUndefined();
    expect(d.captionPrompt).toBeTruthy();
  });
});
