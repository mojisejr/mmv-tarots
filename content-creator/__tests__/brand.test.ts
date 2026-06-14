import { describe, it, expect } from "vitest";
import { createContentDb } from "../db/client";
import { brandProfile } from "../db/schema";
import { getBrandProfile, updateBrandProfile, DEFAULT_BRAND, DEFAULT_REF_PATH } from "../db/brand";

describe("Brand Profile [S3.5b/c]", () => {
  it("getBrandProfile บน DB ว่าง → คืน DEFAULT (หมอมี่ + ref) ให้ engine ใช้ได้ทันที", () => {
    const db = createContentDb(":memory:");
    const b = getBrandProfile(db);
    expect(b.refImagePath).toBe(DEFAULT_REF_PATH);
    expect(b.captionPersona).toContain("หมอมี่");
    expect(b.stylePrompt).toBeTruthy();
  });

  it("updateBrandProfile → upsert singleton + merge (แก้ field เดียวไม่ล้างที่เหลือ)", () => {
    const db = createContentDb(":memory:");
    updateBrandProfile(db, { stylePrompt: "นีออนไซเบอร์" });
    let b = getBrandProfile(db);
    expect(b.stylePrompt).toBe("นีออนไซเบอร์");
    expect(b.captionPersona).toBe(DEFAULT_BRAND.captionPersona); // ไม่โดนล้าง (merge)
    // แก้ persona ต่อ → stylePrompt เดิมคงอยู่
    updateBrandProfile(db, { captionPersona: "ห้าวๆ" });
    b = getBrandProfile(db);
    expect(b.captionPersona).toBe("ห้าวๆ");
    expect(b.stylePrompt).toBe("นีออนไซเบอร์");
  });

  it("singleton — update หลายครั้งมี row เดียว", () => {
    const db = createContentDb(":memory:");
    updateBrandProfile(db, { stylePrompt: "a" });
    updateBrandProfile(db, { stylePrompt: "b" });
    const all = db.select().from(brandProfile).all();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("default");
  });

  // [ตู๋ P1] existing row ที่ cta/maxChars ว่าง (row เก่าก่อนมี field) → fallback DEFAULT (CTA ไม่ปิดเงียบ)
  it("row ที่ ctaText/maxChars ว่าง → getBrandProfile fallback DEFAULT", () => {
    const db = createContentDb(":memory:");
    db.insert(brandProfile).values({ id: "default", stylePrompt: "x", ctaText: "", captionMaxChars: 0 }).run();
    const b = getBrandProfile(db);
    expect(b.ctaText).toBe(DEFAULT_BRAND.ctaText);
    expect(b.captionMaxChars).toBe(DEFAULT_BRAND.captionMaxChars);
    expect(b.stylePrompt).toBe("x"); // ที่ตั้งไว้คงอยู่
  });
});
