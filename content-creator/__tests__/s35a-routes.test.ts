import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

// mock Gemini (ไม่ยิง API จริงในเทสต์ — live พิสูจน์แล้ว browser truth)
const { mockGenCaption, mockGenImage } = vi.hoisted(() => ({
  mockGenCaption: vi.fn(),
  mockGenImage: vi.fn(),
}));
vi.mock("../lib/gemini", () => ({ genCaption: mockGenCaption, genImage: mockGenImage }));

// env ก่อนเรียก route (getContentDb/mediaDir อ่านตอน request)
const TMP = mkdtempSync(join(tmpdir(), "cc-s35a-"));
process.env.CONTENT_DB_PATH = join(TMP, "test.db");
process.env.CONTENT_MEDIA_DIR = join(TMP, "media");
mkdirSync(process.env.CONTENT_MEDIA_DIR, { recursive: true });

import { getContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { GET as templatesGET } from "@/app/content-creator/api/templates/route";
import { POST as previewPOST } from "@/app/content-creator/api/preview/route";
import { POST as createPOST } from "@/app/content-creator/api/create/route";

const enable = () => (process.env.CONTENT_CREATOR_ENABLED = "true");
const disable = () => delete process.env.CONTENT_CREATOR_ENABLED;
const req = (body: unknown) =>
  new Request("http://t", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const GOOD = { templateId: "finance-daily", inputData: { card: "The Sun", meaning: "การเงินสดใส" } };

beforeEach(() => {
  enable();
  mockGenCaption.mockReset().mockResolvedValue("ปังมากแม่! #หมอมี่");
  mockGenImage.mockReset().mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("[S3.5a] templates route", () => {
  it("GET → list finance-daily (มี id+name)", async () => {
    const res = await templatesGET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.templates.some((t: { id: string }) => t.id === "finance-daily")).toBe(true);
  });
  it("disabled → 404", async () => {
    disable();
    expect((await templatesGET()).status).toBe(404);
  });
});

describe("[S3.5a] preview route — build prompt ไม่ gen (ไม่แตะ Gemini)", () => {
  it("valid → คืน captionPrompt + imagePrompt", async () => {
    const res = await previewPOST(req(GOOD));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.captionPrompt.prompt).toContain("The Sun");
    expect(d.imagePrompt).toContain("The Sun");
    expect(mockGenCaption).not.toHaveBeenCalled(); // preview ไม่ gen
  });
  it("input ผิด schema → 400", async () => {
    expect((await previewPOST(req({ templateId: "finance-daily", inputData: { card: "x" } }))).status).toBe(400);
  });
  it("unknown template → 400", async () => {
    expect((await previewPOST(req({ templateId: "nope", inputData: {} }))).status).toBe(400);
  });
  it("disabled → 404", async () => {
    disable();
    expect((await previewPOST(req(GOOD))).status).toBe(404);
  });
});

describe("[S3.5a] create route — insert PENDING + gen (sync)", () => {
  it("valid → 200 ok + DB row GENERATED", async () => {
    const res = await createPOST(req(GOOD));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.status).toBe("GENERATED");
    const row = getContentDb().select().from(contentPosts).where(eq(contentPosts.id, d.id)).get();
    expect(row!.status).toBe("GENERATED");
    expect(row!.caption).toBeTruthy();
    expect(row!.imagePath).toBeTruthy();
  });

  it("Gemini ล้ม → 502 + row FAILED (ไม่ค้าง PENDING/GENERATING)", async () => {
    mockGenImage.mockRejectedValueOnce(new Error("gemini down"));
    const res = await createPOST(req(GOOD));
    expect(res.status).toBe(502);
    const d = await res.json();
    expect(d.ok).toBe(false);
    expect(getContentDb().select().from(contentPosts).where(eq(contentPosts.id, d.id)).get()!.status).toBe("FAILED");
  });

  it("input ผิด schema → 400 (ไม่ insert row ขยะ)", async () => {
    const before = getContentDb().select().from(contentPosts).all().length;
    expect((await createPOST(req({ templateId: "finance-daily", inputData: { card: "x" } }))).status).toBe(400);
    expect(getContentDb().select().from(contentPosts).all().length).toBe(before); // ไม่มี row เพิ่ม
  });

  it("unknown template → 400", async () => {
    expect((await createPOST(req({ templateId: "nope", inputData: {} }))).status).toBe(400);
  });

  it("disabled → 404 (ไม่แตะ DB/Gemini)", async () => {
    disable();
    expect((await createPOST(req(GOOD))).status).toBe(404);
    expect(mockGenCaption).not.toHaveBeenCalled();
  });
});
