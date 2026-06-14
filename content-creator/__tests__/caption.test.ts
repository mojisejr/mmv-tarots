import { describe, it, expect } from "vitest";
import { buildCaptionRequest, validateCaption } from "../lib/caption";

const brand = { captionPersona: "หมอมี่ ฟันธงสั้น", captionMaxChars: 300, ctaText: "ทักพี่หมี่ดูดวงเต็ม", ctaUrl: "https://mmv.app" };
const base = { system: "คุณคือหมอมี่", prompt: "ไพ่: The Sun" };

describe("buildCaptionRequest [S5]", () => {
  it("รวม length + persona + CTA(text+url) + anti-repeat เข้า system", () => {
    const r = buildCaptionRequest({ base, brand, recentCaptions: ["แคปเก่า A", "แคปเก่า B"] });
    expect(r.system).toContain("300 ตัวอักษร");
    expect(r.system).toContain("หมอมี่ ฟันธงสั้น");
    expect(r.system).toContain("ทักพี่หมี่ดูดวงเต็ม");
    expect(r.system).toContain("https://mmv.app");
    expect(r.system).toContain("แคปเก่า A"); // anti-repeat feed
    expect(r.prompt).toBe(base.prompt); // prompt เดิมไม่แตะ
  });

  it("ไม่มี recent → ไม่มี section กันซ้ำ", () => {
    expect(buildCaptionRequest({ base, brand, recentCaptions: [] }).system).not.toContain("ห้ามซ้ำแนว");
  });
});

describe("validateCaption [S5]", () => {
  const b = (over = {}) => ({ captionMaxChars: 300, ctaUrl: "https://mmv.app", ...over });

  it("สั้น + มี url → ok", () => {
    expect(validateCaption("ปังมาก! ดูเพิ่ม https://mmv.app", b()).ok).toBe(true);
  });
  it("ยาวเกิน maxChars → fail", () => {
    expect(validateCaption("x".repeat(301), b({ ctaUrl: "" })).ok).toBe(false);
  });
  it("ตั้ง ctaUrl แต่ caption ไม่มี url → fail (ลืม CTA link)", () => {
    expect(validateCaption("ปังมากแม่ ไม่มีลิงก์", b()).ok).toBe(false);
  });
  it("ctaUrl ว่าง → ไม่บังคับ url", () => {
    expect(validateCaption("ปังมากแม่", b({ ctaUrl: "" })).ok).toBe(true);
  });
  it("ว่าง → fail", () => {
    expect(validateCaption("   ", b({ ctaUrl: "" })).ok).toBe(false);
  });
});
