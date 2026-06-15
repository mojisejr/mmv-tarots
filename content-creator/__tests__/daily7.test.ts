import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { daily7, daily7Schema, deriveThaiDateLabel, canonicalizeDays, type Daily7Input } from "../templates/daily7";
import { DEFAULT_BRAND } from "../db/brand";

const SAMPLE: Daily7Input = {
  targetDate: "2026-06-15",
  days: [
    { day: "จันทร์", fortune: "การงานไหลลื่น เจ้านายเอ็นดู มีโอกาสได้งานใหม่เข้ามา" },
    { day: "อังคาร", fortune: "ระวังปากเสียงกับคนใกล้ตัว ใจเย็นไว้แล้วจะผ่านไปด้วยดี" },
    { day: "พุธ", fortune: "การเงินคล่องตัว มีรายได้เสริมเข้ามาแบบไม่คาดคิด" },
    { day: "พฤหัสบดี", fortune: "ความรักสดใส คนโสดมีเกณฑ์เจอคนถูกใจ" },
    { day: "ศุกร์", fortune: "สุขภาพดี พลังงานเต็มเปี่ยม เหมาะเริ่มสิ่งใหม่" },
    { day: "เสาร์", fortune: "มีโชคลาภเล็กๆ จากผู้ใหญ่ ลองเสี่ยงดูได้" },
    { day: "อาทิตย์", fortune: "ได้พักผ่อนเต็มที่ ครอบครัวอบอุ่น ใจสงบ" },
  ],
};

describe("daily7Schema [S6b FinalInput]", () => {
  it("7 วันครบไม่ซ้ำ → ผ่าน", () => {
    expect(daily7Schema.safeParse(SAMPLE).success).toBe(true);
  });
  it("ไม่ครบ 7 วัน → fail", () => {
    expect(daily7Schema.safeParse({ targetDate: "2026-06-15", days: SAMPLE.days.slice(0, 6) }).success).toBe(false);
  });
  it("วันซ้ำ (ครบ 7 ช่องแต่ซ้ำ) → fail", () => {
    const dup = [...SAMPLE.days.slice(0, 6), { day: "จันทร์" as const, fortune: "ซ้ำ" }];
    expect(daily7Schema.safeParse({ targetDate: "2026-06-15", days: dup }).success).toBe(false);
  });
  it("เกิน 7 → fail", () => {
    expect(daily7Schema.safeParse({ targetDate: "2026-06-15", days: [...SAMPLE.days, { day: "จันทร์", fortune: "x" }] }).success).toBe(false);
  });
  it("targetDate ผิดรูปแบบ → fail", () => {
    expect(daily7Schema.safeParse({ targetDate: "15/06/2026", days: SAMPLE.days }).success).toBe(false);
  });
});

describe("deriveThaiDateLabel [S6c]", () => {
  it("ISO → Thai date (พ.ศ. 2 หลัก)", () => {
    expect(deriveThaiDateLabel("2026-06-15")).toBe("15 มิ.ย. 69"); // 2026+543=2569
    expect(deriveThaiDateLabel("2025-01-05")).toBe("5 ม.ค. 68");
  });
});

describe("canonicalizeDays [S6c gen validate]", () => {
  const full = SAMPLE.days.map((d) => ({ day: d.day as string, fortune: d.fortune }));
  it("ครบ 7 → เรียง canonical", () => {
    const out = canonicalizeDays([...full].reverse());
    expect(out.map((d) => d.day)).toEqual(["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]);
  });
  it("ขาดวัน/ซ้ำ → throw", () => {
    expect(() => canonicalizeDays(full.slice(0, 6))).toThrow(/ขาดวัน|ครบ 7/);
  });
  it("คำทำนายว่าง → throw", () => {
    const withEmpty = [{ day: "จันทร์", fortune: "  " }, ...full.slice(1)];
    expect(() => canonicalizeDays(withEmpty)).toThrow(/ว่าง/);
  });
});

describe("daily7.renderImage [S6b composition — verify real output]", () => {
  it("คืน PNG 1080x1080 จริง (เขียน /tmp ไว้ดูด้วยตา)", async () => {
    const bytes = await daily7.renderImage(SAMPLE, { brand: DEFAULT_BRAND, seed: "post-smoke-1" });
    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47])); // PNG signature
    // golden dimensions จาก IHDR (width @16, height @20 big-endian)
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dv.getUint32(16)).toBe(1080);
    expect(dv.getUint32(20)).toBe(1080);
    writeFileSync("/tmp/daily7-preview.png", bytes);
  }, 30000);

  it("backgroundId (finalized by-id path) → PNG 1080x1080", async () => {
    const bytes = await daily7.renderImage({ ...SAMPLE, backgroundId: "mimi-crystal-pastel" }, { brand: DEFAULT_BRAND, seed: "ignored-when-by-id" });
    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dv.getUint32(16)).toBe(1080);
  }, 30000);

  it("backgroundId ไม่อยู่ใน manifest → throw (ไม่เงียบ)", async () => {
    await expect(daily7.renderImage({ ...SAMPLE, backgroundId: "ghost" }, { brand: DEFAULT_BRAND, seed: "s" })).rejects.toThrow(/manifest/);
  }, 30000);

  it("seed เดิม → bytes เท่าเดิม (deterministic, golden นิ่ง)", async () => {
    const a = await daily7.renderImage(SAMPLE, { brand: DEFAULT_BRAND, seed: "fixed-seed" });
    const b = await daily7.renderImage(SAMPLE, { brand: DEFAULT_BRAND, seed: "fixed-seed" });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  }, 30000);

  it("worst-case Thai ไม่มี space ทุก 7 slot → ยัง 1080x1080 (geometry กันล้น) [ตู๋ P1 regression]", async () => {
    const worst: Daily7Input = {
      targetDate: "2026-06-15",
      days: (["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const).map((day) => ({
        day,
        fortune: "ก".repeat(200), // no break opportunity — เคยล้น panel ทับตัวละคร
      })),
    };
    const bytes = await daily7.renderImage(worst, { brand: DEFAULT_BRAND, seed: "post-worst" });
    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dv.getUint32(16)).toBe(1080); // ขนาดคงที่ = layout ไม่ขยายตาม content
    expect(dv.getUint32(20)).toBe(1080);
    writeFileSync("/tmp/daily7-worstcase.png", bytes); // ดูด้วยตา: ต้องไม่ล้น panel
  }, 30000);
});
