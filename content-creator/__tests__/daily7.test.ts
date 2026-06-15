import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { daily7, daily7Schema, type Daily7Input } from "../templates/daily7";
import { DEFAULT_BRAND } from "../db/brand";

const SAMPLE: Daily7Input = {
  dateLabel: "15 มิ.ย. 68",
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
    expect(daily7Schema.safeParse({ days: SAMPLE.days.slice(0, 6) }).success).toBe(false);
  });
  it("วันซ้ำ (ครบ 7 ช่องแต่ซ้ำ) → fail", () => {
    const dup = [...SAMPLE.days.slice(0, 6), { day: "จันทร์" as const, fortune: "ซ้ำ" }];
    expect(daily7Schema.safeParse({ days: dup }).success).toBe(false);
  });
  it("เกิน 7 → fail", () => {
    expect(daily7Schema.safeParse({ days: [...SAMPLE.days, { day: "จันทร์", fortune: "x" }] }).success).toBe(false);
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

  it("seed เดิม → bytes เท่าเดิม (deterministic, golden นิ่ง)", async () => {
    const a = await daily7.renderImage(SAMPLE, { brand: DEFAULT_BRAND, seed: "fixed-seed" });
    const b = await daily7.renderImage(SAMPLE, { brand: DEFAULT_BRAND, seed: "fixed-seed" });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  }, 30000);
});
