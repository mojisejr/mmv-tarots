import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

// mock Gemini (ไม่ยิง API จริงในเทสต์ — live พิสูจน์แล้ว browser truth + spike)
const { mockGenCaption, mockGenImage, mockGenImageWithRef } = vi.hoisted(() => ({
  mockGenCaption: vi.fn(),
  mockGenImage: vi.fn(),
  mockGenImageWithRef: vi.fn(),
}));
vi.mock("../lib/gemini", () => ({ genCaption: mockGenCaption, genImage: mockGenImage, genImageWithRef: mockGenImageWithRef }));

// env ก่อนเรียก route (getContentDb/mediaDir อ่านตอน request)
const TMP = mkdtempSync(join(tmpdir(), "cc-s35a-"));
process.env.CONTENT_DB_PATH = join(TMP, "test.db");
process.env.CONTENT_MEDIA_DIR = join(TMP, "media");
mkdirSync(process.env.CONTENT_MEDIA_DIR, { recursive: true });

import { getContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { updateBrandProfile } from "../db/brand";
import { GET as templatesGET } from "@/app/content-creator/api/templates/route";
import { POST as previewPOST } from "@/app/content-creator/api/preview/route";
import { POST as createPOST } from "@/app/content-creator/api/create/route";

// brand no-ref (genImage path) + ctaUrl บังคับ (S5) — เทสต์ S3.5a โฟกัส lifecycle ไม่ใช่ brand
const S35A_CTA = "https://mmv.app/luck";
updateBrandProfile(getContentDb(), { refImagePath: null, ctaUrl: S35A_CTA });

const enable = () => (process.env.CONTENT_CREATOR_ENABLED = "true");
const disable = () => delete process.env.CONTENT_CREATOR_ENABLED;
const req = (body: unknown) =>
  new Request("http://t", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const GOOD = { templateId: "finance-daily", inputData: { card: "The Sun", meaning: "การเงินสดใส" } };
// create ต้องมี requestKey (idempotency) — fresh ต่อ call เว้นแต่ทดสอบ idempotent
let keySeq = 0;
const createBody = (over: Record<string, unknown> = {}) => ({ requestKey: `k-${++keySeq}`, ...GOOD, ...over });

beforeEach(() => {
  enable();
  mockGenCaption.mockReset().mockResolvedValue(`ปังมากแม่! #หมอมี่ ทักเลย ${S35A_CTA}`); // มี CTA token (S5)
  mockGenImage.mockReset().mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
  mockGenImageWithRef.mockReset().mockResolvedValue(new Uint8Array([5, 6, 7, 8]));
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
    const res = await createPOST(req(createBody()));
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
    const res = await createPOST(req(createBody()));
    expect(res.status).toBe(502);
    const d = await res.json();
    expect(d.ok).toBe(false);
    expect(getContentDb().select().from(contentPosts).where(eq(contentPosts.id, d.id)).get()!.status).toBe("FAILED");
  });

  it("input ผิด schema → 400 (ไม่ insert row ขยะ)", async () => {
    const before = getContentDb().select().from(contentPosts).all().length;
    expect((await createPOST(req(createBody({ inputData: { card: "x" } }))).then((r) => r.status))).toBe(400);
    expect(getContentDb().select().from(contentPosts).all().length).toBe(before); // ไม่มี row เพิ่ม
  });

  it("unknown template → 400", async () => {
    expect((await createPOST(req(createBody({ templateId: "nope", inputData: {} })))).status).toBe(400);
  });

  it("ขาด requestKey → 400 (idempotency key บังคับ)", async () => {
    expect((await createPOST(req(GOOD))).status).toBe(400); // GOOD ไม่มี requestKey
  });

  it("disabled → 404 (ไม่แตะ DB/Gemini)", async () => {
    disable();
    expect((await createPOST(req(createBody()))).status).toBe(404);
    expect(mockGenCaption).not.toHaveBeenCalled();
  });

  // [P2a] ใช้ parsed.data (canonical) ไม่ใช่ raw → field แปลกปลอมถูก strip ไม่เข้า DB
  it("strip field แปลกปลอม (canonical parsed.data ไม่ใช่ raw body)", async () => {
    const res = await createPOST(req(createBody({ inputData: { card: "X", meaning: "Y", junk: "hax", evil: 1 } })));
    expect(res.status).toBe(200);
    const d = await res.json();
    const row = getContentDb().select().from(contentPosts).where(eq(contentPosts.id, d.id)).get();
    expect(row!.inputData).toEqual({ card: "X", meaning: "Y" }); // junk/evil ถูก strip
  });

  // [P1] idempotency — concurrent/retry ด้วย requestKey เดียว → 1 row + ยิง Gemini ครั้งเดียว (ไม่จ่ายซ้ำ)
  it("requestKey เดียว ยิงพร้อมกัน 2 ครั้ง → 1 row, gen ครั้งเดียว", async () => {
    mockGenCaption.mockClear();
    const key = "idem-concurrent";
    const [r1, r2] = await Promise.all([
      createPOST(req({ requestKey: key, ...GOOD })),
      createPOST(req({ requestKey: key, ...GOOD })),
    ]);
    const j1 = await r1.json();
    const j2 = await r2.json();
    expect(j1.id).toBe(j2.id); // row เดียวกัน
    const rows = getContentDb().select().from(contentPosts).where(eq(contentPosts.requestKey, key)).all();
    expect(rows).toHaveLength(1); // 1 row เท่านั้น
    expect(mockGenCaption).toHaveBeenCalledTimes(1); // Gemini ยิงครั้งเดียว — ไม่จ่ายซ้ำ
    expect([j1.idempotent, j2.idempotent]).toContain(true); // อันที่สองรู้ว่าเป็น idempotent hit
  });

  it("retry ด้วย requestKey เดิม (sequential) → ไม่ gen ซ้ำ", async () => {
    mockGenCaption.mockClear();
    const key = "idem-retry";
    await createPOST(req({ requestKey: key, ...GOOD }));
    await createPOST(req({ requestKey: key, ...GOOD })); // retry
    expect(mockGenCaption).toHaveBeenCalledTimes(1);
    expect(getContentDb().select().from(contentPosts).where(eq(contentPosts.requestKey, key)).all()).toHaveLength(1);
  });

  // [P1] same key ต่าง payload → 409 (กัน key reuse/collision คืน row ผิด)
  it("requestKey เดิม + payload ต่าง → 409 (ไม่คืน row ที่ payload ไม่ตรง)", async () => {
    const key = "idem-diff";
    const first = await createPOST(req({ requestKey: key, ...GOOD }));
    expect(first.status).toBe(200);
    const res = await createPOST(
      req({ requestKey: key, templateId: "finance-daily", inputData: { card: "DIFFERENT", meaning: "X" } }),
    );
    expect(res.status).toBe(409);
  });

  // [P1] lifecycle: duplicate ตอนยัง in-progress → 202 (ไม่ใช่ 200 ok), key valid จน terminal
  it("duplicate ตอน A กำลัง gen → B ได้ 202 in-progress ; หลัง terminal → 200 GENERATED (1 row, gen ครั้งเดียว)", async () => {
    mockGenCaption.mockClear();
    const key = "lifecycle";
    // A: ค้างที่ genCaption (deferred) — row จะอยู่ GENERATING
    let releaseA!: () => void;
    let aAtGen!: () => void;
    const aReached = new Promise<void>((r) => (aAtGen = r));
    mockGenCaption.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          aAtGen();
          releaseA = () => resolve(`ปังมากแม่ ${S35A_CTA}`); // มี CTA token → validate ผ่านรอบเดียว (ไม่ regen)
        }),
    );
    const aPromise = createPOST(req({ requestKey: key, ...GOOD })); // A: PENDING→GENERATING, ค้าง
    await aReached;

    // B: duplicate ตอน A ยัง GENERATING → ต้อง 202 (ไม่ใช่ 200 ok:true)
    const bRes = await createPOST(req({ requestKey: key, ...GOOD }));
    expect(bRes.status).toBe(202);
    const bJson = await bRes.json();
    expect(bJson.inProgress).toBe(true);
    expect(bJson.ok).toBe(false); // ยังไม่ definitive

    releaseA(); // A gen เสร็จ
    expect((await aPromise).status).toBe(200);

    // C: หลัง terminal → 200 ok GENERATED (definitive idempotent)
    const cRes = await createPOST(req({ requestKey: key, ...GOOD }));
    expect(cRes.status).toBe(200);
    const cJson = await cRes.json();
    expect(cJson.ok).toBe(true);
    expect(cJson.status).toBe("GENERATED");

    expect(getContentDb().select().from(contentPosts).where(eq(contentPosts.requestKey, key)).all()).toHaveLength(1);
    expect(mockGenCaption).toHaveBeenCalledTimes(1); // gen ครั้งเดียวตลอด lifecycle
  });

  // [P1] crash-after-insert-before-claim: row PENDING ค้าง (process เดิมตายก่อน claim) →
  // retry key เดิม ต้อง "resume" gen row เดิม (ไม่ค้าง 202 ตลอด, ไม่สร้าง row ใหม่)
  it("PENDING ค้างจาก crash → retry key เดิม resume gen → GENERATED (row เดิม ไม่สร้างใหม่)", async () => {
    const key = "resume-stale-pending";
    const id = crypto.randomUUID();
    // จำลอง: insert PENDING สำเร็จ แล้ว process ตายก่อน claimForGenerate
    getContentDb()
      .insert(contentPosts)
      .values({ id, requestKey: key, templateId: "finance-daily", inputData: { card: "X", meaning: "Y" }, status: "PENDING" })
      .run();

    const res = await createPOST(req({ requestKey: key, templateId: "finance-daily", inputData: { card: "X", meaning: "Y" } }));
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("GENERATED"); // resume สำเร็จ ไม่ค้าง 202

    const rows = getContentDb().select().from(contentPosts).where(eq(contentPosts.requestKey, key)).all();
    expect(rows).toHaveLength(1); // resume row เดิม
    expect(rows[0].id).toBe(id);
    expect(rows[0].status).toBe("GENERATED");
  });

  // [P1] lost-response: gen ล้ม (502) แล้ว response แรกหาย → retry key เดิม → 200 definitive FAILED
  // (ไม่ใช่ 502 ซ้ำ) → client ต้อง clear ได้ (definitive:true) ไม่ค้าง stuck
  it("duplicate row FAILED → 200 definitive:true (ไม่ stuck), client clear ได้", async () => {
    mockGenImage.mockRejectedValueOnce(new Error("gemini down"));
    const key = "lost-fail";
    const first = await createPOST(req({ requestKey: key, ...GOOD }));
    expect(first.status).toBe(502); // ครั้งแรก gen ล้ม
    expect((await first.json()).definitive).toBe(true);

    // retry key เดิม (จำลอง response แรกหาย) → duplicate FAILED → 200 definitive (ไม่ 502 ซ้ำ, ไม่ค้าง 202)
    const retry = await createPOST(req({ requestKey: key, ...GOOD }));
    expect(retry.status).toBe(200);
    const d = await retry.json();
    expect(d.definitive).toBe(true);
    expect(d.ok).toBe(false);
    expect(d.status).toBe("FAILED");
  });
});
