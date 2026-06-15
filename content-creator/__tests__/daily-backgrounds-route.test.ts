import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/content-creator/api/daily/backgrounds/route";

beforeEach(() => (process.env.CONTENT_CREATOR_ENABLED = "true"));

describe("GET /api/daily/backgrounds [S6c.2]", () => {
  it("คืน manifest (id + dimension) จาก pool committed", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.backgrounds.map((b: { id: string }) => b.id)).toContain("mimi-crystal-pastel");
    expect(d.backgrounds[0]).toHaveProperty("width");
  });

  it("ปิด feature → 404", async () => {
    process.env.CONTENT_CREATOR_ENABLED = "false";
    expect((await GET()).status).toBe(404);
  });
});
