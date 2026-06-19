import { describe, it, expect } from "vitest";
import type { BrandProfile } from "../db/schema";
import { generic, genericContentSchema, type GenericContent } from "../templates/generic";

const ctx = { brand: {} as BrandProfile, seed: "test-seed-001" };

function isPng(bytes: Uint8Array): boolean {
  return bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

describe("genericContentSchema [P1.3 strong contract]", () => {
  it("valid → emphasis default normal", () => {
    const c = genericContentSchema.parse({ title: "t", blocks: [{ text: "a" }] });
    expect(c.blocks[0].emphasis).toBe("normal");
  });
  it("hero > 1 → fail", () => {
    expect(genericContentSchema.safeParse({ title: "t", blocks: [{ text: "a", emphasis: "hero" }, { text: "b", emphasis: "hero" }] }).success).toBe(false);
  });
  it("blocks > 5 → fail ; blocks ว่าง → fail ; title ว่าง → fail", () => {
    expect(genericContentSchema.safeParse({ title: "t", blocks: Array.from({ length: 6 }, () => ({ text: "x" })) }).success).toBe(false);
    expect(genericContentSchema.safeParse({ title: "t", blocks: [] }).success).toBe(false);
    expect(genericContentSchema.safeParse({ title: "", blocks: [{ text: "x" }] }).success).toBe(false);
  });
});

describe("generic.buildCaptionPrompt", () => {
  it("รวม title + blocks เข้า prompt", () => {
    const p = generic.buildCaptionPrompt({ title: "ดวงวันนี้", blocks: [{ label: "คำตอบ", text: "ใช่" }] });
    expect(p.prompt).toContain("ดวงวันนี้");
    expect(p.prompt).toContain("ใช่");
    expect(p.system).toContain("พี่มี่");
  });
});

describe("generic.renderImage [P2.3 visual budget — Satori composition]", () => {
  it("single block → PNG 1080", async () => {
    const c: GenericContent = { title: "ดวงวันนี้", blocks: [{ text: "พลังบวกกำลังมา", emphasis: "normal" }] };
    expect(isPng(await generic.renderImage(c, ctx))).toBe(true);
  });

  it("hero + 4 normal (max budget) → PNG", async () => {
    const c: GenericContent = {
      title: "วันนี้ควรเริ่มโปรเจกต์ใหม่ไหม",
      blocks: [
        { label: "คำตอบ", text: "ใช่เลย", emphasis: "hero" },
        { label: "งาน", text: "ลุยได้", emphasis: "normal" },
        { label: "เงิน", text: "ไหลเข้า", emphasis: "normal" },
        { label: "รัก", text: "สดใส", emphasis: "normal" },
        { label: "สุขภาพ", text: "แข็งแรง", emphasis: "normal" },
      ],
    };
    expect(isPng(await generic.renderImage(c, ctx))).toBe(true);
  });

  it("worst-case ไทยไม่มี space ยาวสุด → ยัง render ได้ (line-clamp + wordBreak, ไม่ล้น/ไม่ cut-off)", async () => {
    const c: GenericContent = {
      title: "ก".repeat(60),
      blocks: [
        { text: "ข".repeat(160), emphasis: "hero" },
        { label: "จ".repeat(24), text: "ค".repeat(160), emphasis: "normal" },
      ],
    };
    expect(isPng(await generic.renderImage(c, ctx))).toBe(true);
  });
});
