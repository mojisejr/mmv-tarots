import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TMP = mkdtempSync(join(tmpdir(), "cc-brand-route-"));
process.env.CONTENT_DB_PATH = join(TMP, "test.db");

import { GET, PUT } from "@/app/content-creator/api/brand/route";

const enable = () => (process.env.CONTENT_CREATOR_ENABLED = "true");
const disable = () => delete process.env.CONTENT_CREATOR_ENABLED;
const put = (body: unknown) =>
  new Request("http://t", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(enable);
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("[S3.5b/c] brand route", () => {
  it("GET → brand profile (default หมอมี่ + ref)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.brand.captionPersona).toContain("หมอมี่");
    expect(d.brand.refImagePath).toBeTruthy();
  });

  it("PUT แก้ stylePrompt → GET สะท้อนค่าใหม่", async () => {
    expect((await PUT(put({ stylePrompt: "ทดสอบสไตล์" }))).status).toBe(200);
    const g = await (await GET()).json();
    expect(g.brand.stylePrompt).toBe("ทดสอบสไตล์");
  });

  it("disabled → 404 ทั้ง GET และ PUT", async () => {
    disable();
    expect((await GET()).status).toBe(404);
    expect((await PUT(put({ stylePrompt: "x" }))).status).toBe(404);
  });

  it("invalid body → 400", async () => {
    expect((await PUT(put({ stylePrompt: 123 }))).status).toBe(400);
  });
});
