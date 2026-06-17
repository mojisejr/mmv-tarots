import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";

const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
const full = () => ({ days: WEEKDAYS.map((day) => ({ day, fortune: `${day} วันนี้ดีมาก` })) });

// mock genObject (gen 7 คำทำนาย) — createDaily7Draft เรียกจริง แต่ไม่ยิง Gemini
const { mockGenObject } = vi.hoisted(() => ({ mockGenObject: vi.fn() }));
vi.mock("../lib/gemini", () => ({ genObject: mockGenObject }));

// mock engine.generate — controllable (จำลอง PENDING→GENERATED/FAILED) ; ไม่ render รูปจริง
const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));
vi.mock("../engine", () => ({ generate: mockGenerate }));

import { createContentDb, type ContentDb } from "../db/client";
import { contentPosts } from "../db/schema";
import { tryTransition } from "../db/transition";
import { updateBrandProfile } from "../db/brand";
import { runGenTick, getGenConfig, getGenTickMs, precheckGenReady, type GenConfig } from "../gen-scheduler";

// 2026-06-20 12:00 Bangkok (UTC+7) → today=2026-06-20, minutesOfDay=720
const NOW = new Date("2026-06-20T05:00:00Z");
const TODAY = "2026-06-20";
const ALL_DAYS: GenConfig = { days: [0, 1, 2, 3, 4, 5, 6], slot: "00:00" };

let db: ContentDb;

function genSuccess() {
  mockGenerate.mockImplementation(async (d: ContentDb, id: string) => {
    tryTransition(d, id, "PENDING", "GENERATING");
    tryTransition(d, id, "GENERATING", "GENERATED", { caption: "cap", imagePath: "/m/x.png" });
    return { ok: true, status: "GENERATED" };
  });
}
function setCta() {
  updateBrandProfile(db, { ctaUrl: "https://maemormimi.com/" });
}
function insertDaily7(id: string, status: string, targetDate = TODAY) {
  db.insert(contentPosts).values({ id, templateId: "daily-7", inputData: { targetDate, days: [] }, status: status as never }).run();
}

beforeEach(() => {
  db = createContentDb(":memory:");
  mockGenObject.mockReset().mockResolvedValue(full());
  mockGenerate.mockReset();
  genSuccess();
});
afterEach(() => {
  delete process.env.CONTENT_GEN_SLOT;
  delete process.env.CONTENT_GEN_DAYS;
  delete process.env.CONTENT_GEN_TICK_MS;
});

describe("getGenConfig — fail-closed", () => {
  it("default → ทุกวัน + slot 00:00", () => {
    expect(getGenConfig()).toEqual({ days: [0, 1, 2, 3, 4, 5, 6], slot: "00:00" });
  });
  it("slot ผิดรูป → throw (ไม่ fail-open)", () => {
    process.env.CONTENT_GEN_SLOT = "bad";
    expect(() => getGenConfig()).toThrow(/CONTENT_GEN_SLOT/);
  });
  it("days ผิด → throw", () => {
    process.env.CONTENT_GEN_DAYS = "9";
    expect(() => getGenConfig()).toThrow(/CONTENT_GEN_DAYS/);
  });
});

describe("getGenTickMs — fail-closed [ตู๋ P2.2]", () => {
  it("default → 10 นาที", () => expect(getGenTickMs()).toBe(600000));
  it("positive int → ใช้ค่านั้น", () => {
    process.env.CONTENT_GEN_TICK_MS = "60000";
    expect(getGenTickMs()).toBe(60000);
  });
  it("NaN/0/ลบ → throw (ไม่ fail-open setInterval รัว)", () => {
    for (const bad of ["abc", "0", "-5", "1.5"]) {
      process.env.CONTENT_GEN_TICK_MS = bad;
      expect(() => getGenTickMs()).toThrow(/CONTENT_GEN_TICK_MS/);
    }
  });
});

describe("runGenTick — gate", () => {
  it("วันนี้ไม่อยู่ใน days → closed-day ไม่ gen", async () => {
    setCta();
    const r = await runGenTick(db, { config: { days: [], slot: "00:00" }, now: NOW });
    expect(r.window).toBe("closed-day");
    expect(mockGenObject).not.toHaveBeenCalled();
  });
  it("ยังไม่ถึง slot → closed-time ไม่ gen", async () => {
    setCta();
    const r = await runGenTick(db, { config: { days: [0, 1, 2, 3, 4, 5, 6], slot: "23:00" }, now: NOW });
    expect(r.window).toBe("closed-time");
    expect(mockGenObject).not.toHaveBeenCalled();
  });
});

describe("runGenTick — precheck [ตู๋ P1.4]", () => {
  it("CTA ว่าง → skip-precheck + ไม่จ่าย Gemini เลย", async () => {
    // ไม่ setCta() → ctaUrl ว่าง
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("skip-precheck");
    expect(mockGenObject).not.toHaveBeenCalled(); // ไม่ burn 7 คำทำนาย
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(db.select().from(contentPosts).all()).toHaveLength(0);
  });
  it("precheckGenReady: CTA set + manifest + font → ok", () => {
    setCta();
    expect(precheckGenReady(db).ok).toBe(true);
  });
});

describe("runGenTick — create→finalize→generate", () => {
  it("ยังไม่มีของวันนี้ → gen → GENERATED (1 post)", async () => {
    setCta();
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("generated");
    expect(r.status).toBe("GENERATED");
    expect(mockGenObject).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(db.select().from(contentPosts).all()).toHaveLength(1);
  });

  it("idempotent: tick 2 รอบ → 1 post (รอบ 2 skip-exists, ไม่ gen ซ้ำ)", async () => {
    setCta();
    await runGenTick(db, { config: ALL_DAYS, now: NOW });
    const r2 = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r2.action).toBe("skip-exists");
    expect(r2.status).toBe("GENERATED");
    expect(mockGenerate).toHaveBeenCalledTimes(1); // ไม่ gen ซ้ำ
    expect(db.select().from(contentPosts).all()).toHaveLength(1);
  });

  it("gen ล้ม → gen-failed + status FAILED", async () => {
    setCta();
    mockGenerate.mockImplementation(async (d: ContentDb, id: string) => {
      tryTransition(d, id, "PENDING", "GENERATING");
      tryTransition(d, id, "GENERATING", "FAILED");
      return { ok: false, status: "FAILED", error: "boom" };
    });
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("gen-failed");
    expect(r.status).toBe("FAILED");
  });
});

describe("runGenTick — existing states", () => {
  it("resume PENDING (worker ตายก่อน gen เสร็จ) → gen ต่อ → GENERATED", async () => {
    setCta();
    insertDaily7("p", "PENDING");
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("resumed");
    expect(r.status).toBe("GENERATED");
    expect(mockGenObject).not.toHaveBeenCalled(); // ไม่สร้าง draft ใหม่ (resume ของเดิม)
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("FAILED วันนี้ → skip-failed ไม่ retry (กัน loop burn) [ตู๋ P2]", async () => {
    setCta();
    insertDaily7("f", "FAILED");
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("skip-failed");
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockGenObject).not.toHaveBeenCalled();
  });

  it("GENERATED วันนี้แล้ว (มือ/รอบก่อน) → skip-exists", async () => {
    setCta();
    insertDaily7("g", "GENERATED");
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("skip-exists");
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("POSTED วันนี้แล้ว → skip-exists (ไม่ gen ทับ)", async () => {
    setCta();
    insertDaily7("posted", "POSTED");
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("skip-exists");
    expect(r.status).toBe("POSTED");
    expect(mockGenObject).not.toHaveBeenCalled();
  });

  it("CANCELED วันนี้ (ไม่นับใน fence) → gen ใหม่ได้", async () => {
    setCta();
    insertDaily7("c", "CANCELED");
    const r = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r.action).toBe("generated"); // CANCELED ไม่บล็อก → สร้างใหม่
  });

  it("[ตู๋ P1.1] sequence: tick→generated → ฟีมลบ(CANCELED) → tick สร้าง post ใหม่ (ไม่ติด replay key เดิม)", async () => {
    setCta();
    // tick 1 → post A GENERATED
    const r1 = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r1.action).toBe("generated");
    const a = db.select().from(contentPosts).all();
    expect(a).toHaveLength(1);
    const idA = a[0].id;

    // ฟีมลบ A → CANCELED (ผ่าน manual workflow)
    tryTransition(db, idA, "GENERATED", "CANCELED");

    // tick 2 → ต้องสร้าง post ใหม่ (epoch เปลี่ยนเพราะ canceledCount=1 → key ใหม่ → draft+gen ใหม่)
    const r2 = await runGenTick(db, { config: ALL_DAYS, now: NOW });
    expect(r2.action).toBe("generated"); // ไม่ใช่ skip/replay
    expect(r2.status).toBe("GENERATED");

    const all = db.select().from(contentPosts).all();
    expect(all).toHaveLength(2); // A (CANCELED) + B (GENERATED) — ของจริงคนละ row
    expect(all.filter((p) => p.status === "CANCELED")).toHaveLength(1);
    expect(all.filter((p) => p.status === "GENERATED")).toHaveLength(1);
    expect(all.find((p) => p.status === "GENERATED")!.id).not.toBe(idA);
    expect(mockGenObject).toHaveBeenCalledTimes(2); // draft ใหม่ (key ต่าง epoch) → gen 7 ใหม่
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });
});
