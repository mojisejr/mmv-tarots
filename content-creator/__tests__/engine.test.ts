import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { eq } from "drizzle-orm";

// mock gemini lib (ไม่ยิง API จริง — live พิสูจน์แล้ว POC #1)
const { mockGenCaption, mockGenImage } = vi.hoisted(() => ({
  mockGenCaption: vi.fn(),
  mockGenImage: vi.fn(),
}));
vi.mock("../lib/gemini", () => ({
  genCaption: mockGenCaption,
  genImage: mockGenImage,
}));

import { createContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { generate } from "../engine";

const tmpDirs: string[] = [];
function setup() {
  const dir = mkdtempSync(join(tmpdir(), "cc-engine-"));
  tmpDirs.push(dir);
  process.env.CONTENT_MEDIA_DIR = join(dir, "media");
  const db = createContentDb(":memory:");
  return { db, dir };
}
beforeEach(() => {
  mockGenCaption.mockReset().mockResolvedValue("ปังมากแม่! #ดูดวงการเงิน #หมอมี่");
  mockGenImage.mockReset().mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
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

  // [P1] ownership token — stale worker ที่โดน reclaim ระหว่าง gen ห้ามทับ attempt ใหม่
  it("race: A claim+ค้าง → reclaim ให้ B → A เสร็จต้องไม่ทับ B (SUPERSEDED)", async () => {
    const { db } = setup();
    insertPending(db, "race", { card: "The Star", meaning: "ความหวัง" });
    // genImage ของ A ค้างไว้ (deterministic deferred) — A claim ได้ token แล้วแต่ยัง gen ไม่เสร็จ
    let releaseA!: (b: Uint8Array) => void;
    let signalGenImageCalled!: () => void;
    const genImageCalled = new Promise<void>((r) => { signalGenImageCalled = r; });
    mockGenImage.mockImplementationOnce(() => {
      signalGenImageCalled(); // บอก test ว่า A ผ่าน claim+caption มาถึง genImage แล้ว
      return new Promise<Uint8Array>((r) => { releaseA = r; });
    });
    const aPromise = generate(db, "race"); // A: PENDING→GENERATING (tokenA), await genImage
    await genImageCalled; // แน่ใจว่า A claim เสร็จและค้างที่ genImage (deterministic)
    // จำลอง reclaim: B เข้ามาแทน (token ใหม่ ยังเป็น GENERATING) — เช่น reconciliation/worker ใหม่
    db.update(contentPosts).set({ generationToken: "tokenB" }).where(eq(contentPosts.id, "race")).run();
    releaseA(new Uint8Array([9, 9, 9])); // A gen เสร็จ → markGenerated(tokenA) ต้อง false
    const aRes = await aPromise;
    expect(aRes.status).toBe("SUPERSEDED"); // A รู้ตัวว่าโดน supersede
    const row = db.select().from(contentPosts).where(eq(contentPosts.id, "race")).get()!;
    expect(row.status).toBe("GENERATING"); // ยังเป็น attempt ของ B (A ทับไม่ได้)
    expect(row.generationToken).toBe("tokenB"); // token ของ B ยังอยู่ครบ
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
