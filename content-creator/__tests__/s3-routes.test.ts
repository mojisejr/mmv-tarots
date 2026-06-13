import { describe, it, expect, afterAll, afterEach, beforeEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

// ตั้ง env ก่อนเรียก route (getContentDb/mediaDir อ่านตอน request ไม่ใช่ตอน import)
const TMP = mkdtempSync(join(tmpdir(), "cc-s3-"));
const MEDIA = join(TMP, "media");
process.env.CONTENT_DB_PATH = join(TMP, "test.db");
process.env.CONTENT_MEDIA_DIR = MEDIA;
mkdirSync(MEDIA, { recursive: true });

import { getContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { GET as postsGET } from "@/app/content-creator/api/posts/route";
import { POST as approvePOST } from "@/app/content-creator/api/approve/route";
import { GET as mediaGET } from "@/app/content-creator/api/media/[name]/route";
import { middleware } from "@/middleware";

const enable = () => (process.env.CONTENT_CREATOR_ENABLED = "true");
const disable = () => delete process.env.CONTENT_CREATOR_ENABLED;

function approveReq(body: unknown) {
  return new Request("http://t/content-creator/api/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const mediaCtx = (name: string) => ({ params: Promise.resolve({ name }) });
const mwReq = (path: string) => new NextRequest(new URL(`http://localhost${path}`));

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("[S3] middleware guard — 404 จริงเมื่อปิด (page + nested API)", () => {
  it("disabled → /content-creator + /content-creator/api/* = 404", () => {
    disable();
    expect(middleware(mwReq("/content-creator")).status).toBe(404);
    expect(middleware(mwReq("/content-creator/api/posts")).status).toBe(404);
    expect(middleware(mwReq("/content-creator/api/media/x.png")).status).toBe(404);
  });
  it("enabled → ผ่าน (ไม่ 404)", () => {
    enable();
    expect(middleware(mwReq("/content-creator")).status).not.toBe(404);
  });
});

describe("[S3] production hard-off — NODE_ENV=production → ปิดทุกทางแม้ enabled=true [ตู๋ P1]", () => {
  const saved = process.env.NODE_ENV;
  beforeEach(() => {
    enable();
    (process.env as Record<string, string>).NODE_ENV = "production";
  });
  afterEach(() => {
    (process.env as Record<string, string>).NODE_ENV = saved ?? "test";
  });
  it("middleware + posts + approve + media → 404 ใน production", async () => {
    expect(middleware(mwReq("/content-creator")).status).toBe(404);
    expect((await postsGET()).status).toBe(404);
    expect((await approvePOST(approveReq({ id: "x", action: "approve" }))).status).toBe(404);
    expect((await mediaGET(new Request("http://t"), mediaCtx("a.png"))).status).toBe(404);
  });
});

describe("[S3] route disabled-gate — ปิดแล้วต้อง 404 จริงทุก route (กัน expose)", () => {
  beforeEach(disable);
  it("posts GET → 404 เมื่อ feature ปิด", async () => {
    expect((await postsGET()).status).toBe(404);
  });
  it("approve POST → 404 เมื่อ feature ปิด (ไม่แตะ DB)", async () => {
    expect((await approvePOST(approveReq({ id: "x", action: "approve" }))).status).toBe(404);
  });
  it("media GET → 404 เมื่อ feature ปิด", async () => {
    expect((await mediaGET(new Request("http://t"), mediaCtx("a.png"))).status).toBe(404);
  });
});

describe("[S3] approve route — GENERATED → APPROVED/CANCELED (atomic)", () => {
  beforeEach(enable);

  it("approve โพสต์ GENERATED → 200 + DB เป็น APPROVED", async () => {
    const db = getContentDb();
    db.insert(contentPosts).values({ id: "ap1", templateId: "finance-daily", inputData: {}, status: "GENERATED" }).run();
    const res = await approvePOST(approveReq({ id: "ap1", action: "approve" }));
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("APPROVED");
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "ap1")).get()!.status).toBe("APPROVED");
  });

  it("approve ซ้ำ (ไม่ใช่ GENERATED แล้ว) → 409 (กัน double-approve)", async () => {
    const res = await approvePOST(approveReq({ id: "ap1", action: "approve" })); // ap1 เป็น APPROVED แล้ว
    expect(res.status).toBe(409);
    expect((await res.json()).ok).toBe(false);
  });

  it("cancel โพสต์ GENERATED → 200 + CANCELED", async () => {
    const db = getContentDb();
    db.insert(contentPosts).values({ id: "cn1", templateId: "t", inputData: {}, status: "GENERATED" }).run();
    const res = await approvePOST(approveReq({ id: "cn1", action: "cancel" }));
    expect(res.status).toBe(200);
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "cn1")).get()!.status).toBe("CANCELED");
  });

  it("ghost id → 409", async () => {
    expect((await approvePOST(approveReq({ id: "nope", action: "approve" }))).status).toBe(409);
  });

  it("body ผิด schema → 400", async () => {
    expect((await approvePOST(approveReq({ id: "" }))).status).toBe(400);
    expect((await approvePOST(approveReq({ id: "x", action: "delete" }))).status).toBe(400);
  });
});

describe("[S3] media route — path traversal กันหลุด media root (บทเรียน S2 P2)", () => {
  beforeEach(enable);

  it("ไฟล์ใน media dir + .png → 200 image/png", async () => {
    writeFileSync(join(MEDIA, "good-1.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const res = await mediaGET(new Request("http://t"), mediaCtx("good-1.png"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });

  it("../ escape → 404 (basename ตัด path, ไม่อ่านไฟล์นอก root)", async () => {
    writeFileSync(join(TMP, "evil.png"), Buffer.from([1, 2, 3])); // วางไว้ "นอก" media dir
    const res = await mediaGET(new Request("http://t"), mediaCtx("../evil.png"));
    expect(res.status).toBe(404); // basename → "evil.png" → หาใน media dir → ไม่เจอ → 404 (ไม่หลุดไปอ่าน ../evil.png)
  });

  it("symlink ใน media dir ชี้ออกนอก → 404 (ไม่ follow, lexical resolve ไม่พอ) [ตู๋ P2]", async () => {
    writeFileSync(join(TMP, "outside-secret.png"), Buffer.from("OUTSIDE_SECRET"));
    symlinkSync(join(TMP, "outside-secret.png"), join(MEDIA, "linked.png")); // media/linked.png -> ../outside-secret.png
    const res = await mediaGET(new Request("http://t"), mediaCtx("linked.png"));
    expect(res.status).toBe(404); // reject symlink — ไม่ leak ไฟล์นอก root
  });

  it("ไม่ใช่ .png → 404", async () => {
    expect((await mediaGET(new Request("http://t"), mediaCtx("notes.txt"))).status).toBe(404);
  });

  it("ไฟล์ไม่มีอยู่ → 404", async () => {
    expect((await mediaGET(new Request("http://t"), mediaCtx("missing.png"))).status).toBe(404);
  });
});
