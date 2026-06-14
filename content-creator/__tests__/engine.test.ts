import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep, basename } from "node:path";
import { eq } from "drizzle-orm";

// mock gemini lib (ไม่ยิง API จริง — live พิสูจน์แล้ว POC #1 + spike)
const { mockGenCaption, mockGenImage, mockGenImageWithRef } = vi.hoisted(() => ({
  mockGenCaption: vi.fn(),
  mockGenImage: vi.fn(),
  mockGenImageWithRef: vi.fn(),
}));
vi.mock("../lib/gemini", () => ({
  genCaption: mockGenCaption,
  genImage: mockGenImage,
  genImageWithRef: mockGenImageWithRef,
}));

import { createContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { updateBrandProfile } from "../db/brand";
import { generate } from "../engine";

const tmpDirs: string[] = [];
/** setup db + media ; default brand เป็น no-ref (genImage path) ให้ test S2 เดิมไม่เปลี่ยนพฤติกรรม */
const CTA_URL = "https://mmv.app/luck"; // ctaUrl บังคับ (S5) — caption mock ต้องมี token นี้
function setup(opts: { ref?: string | null; ctaUrl?: string } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "cc-engine-"));
  tmpDirs.push(dir);
  process.env.CONTENT_MEDIA_DIR = join(dir, "media");
  const db = createContentDb(":memory:");
  // CTA mandatory → ตั้ง ctaUrl (เว้นแต่ test เจตนาไม่ตั้ง) ; default no-ref → genImage
  updateBrandProfile(db, { refImagePath: opts.ref ?? null, ctaUrl: opts.ctaUrl ?? CTA_URL });
  return { db, dir };
}
beforeEach(() => {
  // caption mock: สั้น + มี CTA token (ผ่าน validate)
  mockGenCaption.mockReset().mockResolvedValue(`ปังมากแม่! #หมอมี่ ทักเลย ${CTA_URL}`);
  mockGenImage.mockReset().mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
  mockGenImageWithRef.mockReset().mockResolvedValue(new Uint8Array([5, 6, 7, 8]));
});
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true });
  delete process.env.CONTENT_MEDIA_DIR;
});

function insertPending(db: ReturnType<typeof createContentDb>, id: string, inputData: unknown) {
  db.insert(contentPosts).values({ id, templateId: "finance-daily", inputData: inputData as Record<string, unknown> }).run();
}

describe("generate engine [S2]", () => {
  it("PENDING → GENERATED: caption+ภาพ saved, imagePath file มีจริง", async () => {
    const { db } = setup();
    insertPending(db, "a", { card: "8 of Wands", meaning: "ลื่นไหล" });
    const res = await generate(db, "a");
    expect(res.status).toBe("GENERATED");
    expect(res.caption).toContain("หมอมี่");
    expect(existsSync(res.imagePath!)).toBe(true);
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, "a")).get();
    expect(row!.status).toBe("GENERATED");
    expect(row!.caption).toBeTruthy();
    expect(row!.imagePath).toBe(res.imagePath);
  });

  it("claim: generate ซ้ำ row เดิม → SKIPPED (กัน gen ซ้ำ/เปลือง Gemini)", async () => {
    const { db } = setup();
    insertPending(db, "b", { card: "Ace of Coins", meaning: "โชคลาภ" });
    await generate(db, "b"); // GENERATED
    const again = await generate(db, "b"); // ไม่ใช่ PENDING แล้ว
    expect(again.status).toBe("SKIPPED");
    expect(mockGenCaption).toHaveBeenCalledTimes(1); // เรียก Gemini แค่ครั้งเดียว
  });

  it("Gemini ล้ม → FAILED (release claim, ไม่ค้าง GENERATING)", async () => {
    const { db } = setup();
    mockGenImage.mockRejectedValueOnce(new Error("gemini down"));
    insertPending(db, "c", { card: "The Tower", meaning: "พัง" });
    const res = await generate(db, "c");
    expect(res.status).toBe("FAILED");
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "c")).get()!.status).toBe("FAILED");
  });

  it("input ผิด schema → FAILED (ไม่เรียก Gemini)", async () => {
    const { db } = setup();
    insertPending(db, "d", { card: "x" }); // ขาด meaning
    const res = await generate(db, "d");
    expect(res.status).toBe("FAILED");
    expect(mockGenCaption).not.toHaveBeenCalled();
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "d")).get()!.status).toBe("FAILED");
  });

  // [S5] caption ยาวเกิน maxChars → regen 1 ครั้ง → ยังเกิน → FAILED (ไม่ปล่อยแคปชั่นผิดกติกา)
  it("caption ยาวเกิน maxChars → regen แล้วยังเกิน → FAILED", async () => {
    const { db } = setup(); // brand default maxChars 300
    mockGenCaption.mockReset().mockResolvedValue("ก".repeat(500)); // ยาวเกิน maxChars (450) ทั้ง gen + regen
    insertPending(db, "long", { card: "The Sun", meaning: "การเงินดี" });
    const res = await generate(db, "long");
    expect(res.status).toBe("FAILED");
    expect(mockGenCaption).toHaveBeenCalledTimes(2); // gen + regen 1 ครั้ง
    expect(mockGenImage).not.toHaveBeenCalled(); // caption ล้มก่อน → ไม่ gen ภาพ
  });

  // [S5/ตู๋] CTA mandatory — ไม่ตั้ง ctaUrl → FAILED ก่อน Gemini (ไม่จ่ายฟรี)
  it("ไม่ตั้ง ctaUrl → FAILED ก่อนเรียก Gemini (CTA บังคับ)", async () => {
    const { db } = setup({ ctaUrl: "" });
    insertPending(db, "nocta", { card: "X", meaning: "Y" });
    const res = await generate(db, "nocta");
    expect(res.status).toBe("FAILED");
    expect(mockGenCaption).not.toHaveBeenCalled();
    expect(mockGenImage).not.toHaveBeenCalled();
  });

  // [P1] ownership token + filesystem fence — stale worker ห้ามทับไฟล์ของ attempt ที่ชนะ
  // ลำดับที่ ตู๋ ขอ: A ค้าง → reclaim → B complete (bytes รู้ค่า) → A complete ทีหลัง → B ต้องไม่เปลี่ยน, A ถูกลบ
  it("race: B complete ก่อน, A complete ทีหลัง → B's file/path คงเดิม + A's stale artifact ถูกลบ", async () => {
    const { db, dir } = setup();
    const mediaDir = join(dir, "media");
    insertPending(db, "race", { card: "The Star", meaning: "ความหวัง" });

    // A claim ก่อน แล้วค้างที่ genImage (deterministic deferred)
    let releaseA!: (b: Uint8Array) => void;
    let signalAAtGenImage!: () => void;
    const aAtGenImage = new Promise<void>((r) => { signalAAtGenImage = r; });
    mockGenImage.mockImplementationOnce(() => {
      signalAAtGenImage(); // A ผ่าน claim(tokenA)+caption มาถึง genImage แล้ว
      return new Promise<Uint8Array>((r) => { releaseA = r; });
    });
    const aPromise = generate(db, "race"); // A: PENDING→GENERATING(tokenA), ค้างที่ genImage
    await aAtGenImage;

    // จำลอง reclaim หลัง expiry: reset เป็น PENDING ให้ B claim token ใหม่ได้
    db.update(contentPosts).set({ status: "PENDING", generationToken: null, generatingAt: null }).where(eq(contentPosts.id, "race")).run();

    // B run เต็ม → GENERATED ด้วย bytes ที่รู้ค่า
    const bBytes = new Uint8Array([66, 66, 66]);
    mockGenImage.mockResolvedValueOnce(bBytes);
    const bRes = await generate(db, "race");
    expect(bRes.status).toBe("GENERATED");
    const bPath = bRes.imagePath!;
    const bRow = db.select().from(contentPosts).where(eq(contentPosts.id, "race")).get()!;
    expect(bRow.status).toBe("GENERATED");
    expect(bRow.imagePath).toBe(bPath);
    expect(Array.from(readFileSync(bPath))).toEqual([66, 66, 66]);

    // A กลับมาทีหลัง พยายาม complete ด้วย stale bytes
    releaseA(new Uint8Array([1, 1, 1]));
    const aRes = await aPromise;
    expect(aRes.status).toBe("SUPERSEDED"); // A รู้ตัวว่าแพ้

    // B ไม่ถูกแตะ: path/contents เดิม (A เขียนคนละไฟล์เพราะ token-scoped)
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "race")).get()!.imagePath).toBe(bPath);
    expect(Array.from(readFileSync(bPath))).toEqual([66, 66, 66]); // bytes ของ B ไม่เปลี่ยน
    // A's stale artifact ถูก cleanup → เหลือแค่ไฟล์ของ B ใน media dir
    expect(readdirSync(mediaDir)).toEqual([basename(bPath)]);
  });

  // [P2] path traversal — id ที่มี ../ ต้องไม่หลุดออกนอก media root
  it("path traversal: id มี ../ → ไฟล์ถูก sanitize อยู่ใน media dir เสมอ", async () => {
    const { db, dir } = setup();
    insertPending(db, "../../../etc/evil", { card: "The Moon", meaning: "ลวง" });
    const res = await generate(db, "../../../etc/evil");
    expect(res.status).toBe("GENERATED");
    const mediaRoot = resolve(join(dir, "media"));
    expect(resolve(res.imagePath!).startsWith(mediaRoot + sep)).toBe(true); // อยู่ใต้ media root
    expect(existsSync(res.imagePath!)).toBe(true);
  });
});

describe("generate engine — Brand Profile steering [S3.5b/c]", () => {
  const REF = "content-creator/brand/mimi-reference.png"; // committed asset (มีจริงใน repo)

  it("brand มี ref → ใช้ genImageWithRef (nano banana) ไม่ใช่ genImage + ส่ง NO-TEXT + style + persona", async () => {
    const { db } = setup({ ref: REF });
    insertPending(db, "ref1", { card: "The Sun", meaning: "การเงินสดใส" });
    const res = await generate(db, "ref1");
    expect(res.status).toBe("GENERATED");
    expect(mockGenImageWithRef).toHaveBeenCalledTimes(1);
    expect(mockGenImage).not.toHaveBeenCalled(); // ref path ไม่ใช้ text-to-image
    const refArg = mockGenImageWithRef.mock.calls[0][0];
    expect(refArg.prompt).toContain("ภาพอ้างอิงที่แนบมา"); // character-preservation directive (กันได้ฟีนิกซ์แทนแมว)
    expect(refArg.prompt).toContain("ตัวละครเดียวกัน");
    expect(refArg.prompt).toContain("ห้ามมีตัวอักษร"); // NO_TEXT directive (caveat spike)
    expect(refArg.prompt).toContain("พาสเทล"); // style prompt ผสม (เป็น theme รอง)
    expect(refArg.refImage).toBeInstanceOf(Uint8Array);
    // persona เข้า caption system
    expect(mockGenCaption.mock.calls[0][0].system).toContain("หมอมี่");
  });

  it("brand ไม่มี ref → ใช้ genImage (text-to-image) + style ผสม", async () => {
    const { db } = setup({ ref: null });
    insertPending(db, "noref", { card: "8 of Wands", meaning: "ลื่นไหล" });
    await generate(db, "noref");
    expect(mockGenImage).toHaveBeenCalledTimes(1);
    expect(mockGenImageWithRef).not.toHaveBeenCalled();
  });

  it("ref ไม่พบ → FAILED ก่อน Gemini (preflight, ไม่จ่าย genCaption ฟรี) [ตู๋ P1]", async () => {
    const { db } = setup({ ref: "content-creator/brand/nonexistent.png" });
    insertPending(db, "badref", { card: "X", meaning: "Y" });
    const res = await generate(db, "badref");
    expect(res.status).toBe("FAILED");
    expect(mockGenCaption).not.toHaveBeenCalled(); // preflight ล้มก่อน paid call
    expect(mockGenImageWithRef).not.toHaveBeenCalled();
    expect(db.select().from(contentPosts).where(eq(contentPosts.id, "badref")).get()!.status).toBe("FAILED");
  });

  it("ref เป็น symlink ชี้ออกนอก repo → FAILED ก่อน Gemini (ไม่ leak local file) [ตู๋ P1]", async () => {
    const outside = join(mkdtempSync(join(tmpdir(), "cc-outside-")), "secret.png");
    writeFileSync(outside, Buffer.from("OUTSIDE_SECRET"));
    const linkRel = "content-creator/brand/evil-link.png";
    const linkAbs = resolve(process.cwd(), linkRel);
    symlinkSync(outside, linkAbs); // symlink ใน repo ชี้ออกนอก
    try {
      const { db } = setup({ ref: linkRel });
      insertPending(db, "symref", { card: "X", meaning: "Y" });
      const res = await generate(db, "symref");
      expect(res.status).toBe("FAILED"); // reject symlink — ไม่อ่าน OUTSIDE_SECRET
      expect(mockGenCaption).not.toHaveBeenCalled();
    } finally {
      rmSync(linkAbs, { force: true }); // ลบ symlink ออกจาก working tree (กัน git เห็น)
    }
  });
});
