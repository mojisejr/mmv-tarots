import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomCardsTemplate, randomCardsSchema } from "../templates/random-cards";
import { drawCards } from "../lib/card-pool";

const validInput = () => ({ cardIds: drawCards("t-seed", 3).map((c) => c.id), quote: "เปลี่ยนแปลงสู่สิ่งที่ดี", body: "ช่วงนี้มีพลังบวกเข้ามา" });

describe("random-cards template [PR#103]", () => {
  it("strategy = hybrid + มี buildImagePrompt + renderComposite", () => {
    expect(randomCardsTemplate.imageStrategy).toBe("hybrid");
    expect(typeof randomCardsTemplate.buildImagePrompt).toBe("function");
    expect(typeof randomCardsTemplate.renderComposite).toBe("function");
  });

  it("schema: 3 cardIds unique ผ่าน ; ซ้ำ/ไม่ครบ 3 → reject", () => {
    expect(() => randomCardsSchema.parse(validInput())).not.toThrow();
    expect(() => randomCardsSchema.parse({ cardIds: ["major-00", "major-00", "major-01"], quote: "x", body: "y" })).toThrow(/ไม่ซ้ำ/);
    expect(() => randomCardsSchema.parse({ cardIds: ["major-00", "major-01"], quote: "x", body: "y" })).toThrow();
  });

  it("[ตู๋ P1] buildImagePrompt = ฉาก no text/cards (ไพ่+ข้อความมาจาก composition เท่านั้น)", () => {
    const p = randomCardsTemplate.buildImagePrompt(validInput());
    expect(p).toMatch(/ห้ามวาดไพ่/);
    expect(p).not.toMatch(/major-/); // ไม่มี card id หลุดเข้า AI prompt
  });

  it("buildCaptionPrompt: มีชื่อไพ่ (TH/EN) + สั่งกระชับ", () => {
    const cp = randomCardsTemplate.buildCaptionPrompt(validInput());
    expect(cp.system).toMatch(/350|กระชับ/);
    expect(cp.prompt).toMatch(/ไพ่ที่จั่วได้ 3 ใบ/);
  });

  it("renderComposite: AI scene + ไพ่จริง + ข้อความ → PNG bytes (composite จริง)", async () => {
    const scene = new Uint8Array(readFileSync(join(process.cwd(), "content-creator", "brand", "mimi-reference.png")));
    const bytes = await randomCardsTemplate.renderComposite(validInput(), { brand: {} as never, seed: "rc1" }, scene);
    expect(bytes.length).toBeGreaterThan(5000); // ได้ภาพจริง (โหลดไพ่ + render ผ่าน)
    expect(bytes[0]).toBe(0x89); // PNG signature
  });
});
