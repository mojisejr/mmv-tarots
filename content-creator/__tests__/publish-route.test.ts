import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

// mock FB lib (ไม่ยิงเพจจริงในเทสต์ — live พิสูจน์ POC#2)
const { mockUpload, mockPublish } = vi.hoisted(() => ({ mockUpload: vi.fn(), mockPublish: vi.fn() }));
vi.mock("../lib/facebook", () => ({ uploadUnpublishedPhoto: mockUpload, publishToFeed: mockPublish }));

const TMP = mkdtempSync(join(tmpdir(), "cc-pub-"));
process.env.CONTENT_DB_PATH = join(TMP, "test.db");
process.env.CONTENT_MEDIA_DIR = join(TMP, "media");
process.env.CONTENT_FB_PAGE_ID = "page123";
process.env.CONTENT_FB_PAGE_ACCESS_TOKEN = "tok123";
mkdirSync(process.env.CONTENT_MEDIA_DIR, { recursive: true });
writeFileSync(join(process.env.CONTENT_MEDIA_DIR, "img.png"), Buffer.from([1, 2, 3])); // image จริง

import { getContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { POST as publishPOST } from "@/app/content-creator/api/publish/route";

const enable = () => (process.env.CONTENT_CREATOR_ENABLED = "true");
const disable = () => delete process.env.CONTENT_CREATOR_ENABLED;
const req = (body: unknown) =>
  new Request("http://t", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

let seq = 0;
function seedApproved(over: Record<string, unknown> = {}) {
  const id = `pub-${++seq}`;
  getContentDb()
    .insert(contentPosts)
    .values({ id, templateId: "finance-daily", inputData: {}, status: "APPROVED", caption: "ปังมาก", imagePath: "content-creator/media/img.png", ...over })
    .run();
  return id;
}
const statusOf = (id: string) => getContentDb().select().from(contentPosts).where(eq(contentPosts.id, id)).get()!.status;

beforeEach(() => {
  enable();
  mockUpload.mockReset().mockResolvedValue("media_fb_1");
  mockPublish.mockReset().mockResolvedValue("post_fb_1");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("[S4a] publish route", () => {
  it("disabled → 404 (ไม่แตะ FB)", async () => {
    disable();
    const id = seedApproved();
    expect((await publishPOST(req({ id }))).status).toBe(404);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("APPROVED → 200 POSTED (upload→publish→markPosted + fbPostId)", async () => {
    const id = seedApproved();
    const res = await publishPOST(req({ id }));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.status).toBe("POSTED");
    expect(d.fbPostId).toBe("post_fb_1");
    expect(statusOf(id)).toBe("POSTED");
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledTimes(1);
  });

  it("ไม่ใช่ APPROVED (เช่น GENERATED) → 409 (ไม่ยิง FB)", async () => {
    const id = seedApproved({ status: "GENERATED" });
    expect((await publishPOST(req({ id }))).status).toBe(409);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("ghost id → 404", async () => {
    expect((await publishPOST(req({ id: "nope" }))).status).toBe(404);
  });

  // [gate ตู๋] publishToFeed ล้ม = AMBIGUOUS → คง PUBLISHING (ไม่ release กันโพสต์ซ้ำ)
  it("publish ล้ม → 502 ambiguous + ค้าง PUBLISHING (ไม่ release→APPROVED)", async () => {
    mockPublish.mockRejectedValueOnce(new Error("FB 5xx response หาย"));
    const id = seedApproved();
    const res = await publishPOST(req({ id }));
    expect(res.status).toBe(502);
    const d = await res.json();
    expect(d.ambiguous).toBe(true);
    expect(statusOf(id)).toBe("PUBLISHING"); // ค้าง — ไม่ release (กันโพสต์ซ้ำ)
  });

  // upload ล้ม = ยังไม่โพสต์ → release→APPROVED ปลอดภัย (retry ได้)
  it("upload ล้ม (ก่อน publish) → 502 + กลับ APPROVED (retry ได้, ไม่ยิง publish)", async () => {
    mockUpload.mockRejectedValueOnce(new Error("upload fail"));
    const id = seedApproved();
    const res = await publishPOST(req({ id }));
    expect(res.status).toBe(502);
    expect(statusOf(id)).toBe("APPROVED"); // release ปลอดภัย
    expect(mockPublish).not.toHaveBeenCalled();
  });

  // mediaFbid reuse — มีแล้วไม่ upload ซ้ำ
  it("มี mediaFbid แล้ว → ข้าม upload, publish เลย (กัน upload ซ้ำ)", async () => {
    const id = seedApproved({ mediaFbid: "already_uploaded" });
    const res = await publishPOST(req({ id }));
    expect(res.status).toBe(200);
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(mockPublish.mock.calls[0][0].mediaFbid).toBe("already_uploaded");
  });

  it("FB env ไม่ครบ → 500", async () => {
    const saved = process.env.CONTENT_FB_PAGE_ID;
    delete process.env.CONTENT_FB_PAGE_ID;
    const id = seedApproved();
    expect((await publishPOST(req({ id }))).status).toBe(500);
    process.env.CONTENT_FB_PAGE_ID = saved;
  });
});
