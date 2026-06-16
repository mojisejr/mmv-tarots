import { describe, it, expect } from "vitest";
import { buildCaptionRequest, validateCaption, hasUrlToken, normalizeBrandTerms } from "../lib/caption";

const brand = { captionPersona: "หมอมี่ ฟันธงสั้น", captionMaxChars: 300, ctaText: "ทักพี่มี่ดูดวงเต็ม", ctaUrl: "https://mmv.app" };
const base = { system: "คุณคือหมอมี่", prompt: "ไพ่: The Sun" };

describe("normalizeBrandTerms — พี่มี่ เสมอ [brand consistency]", () => {
  it("พี่หมี่ → พี่มี่ (ทุกที่ในข้อความ)", () => {
    expect(normalizeBrandTerms("พี่หมี่ซัพพอร์ตเต็มที่ ทักพี่หมี่ได้")).toBe("พี่มี่ซัพพอร์ตเต็มที่ ทักพี่มี่ได้");
  });
  it("ไม่แตะ 'หมอมี่' (ชื่อแบรนด์ที่ถูก)", () => {
    expect(normalizeBrandTerms("หมอมี่ทักทาย")).toBe("หมอมี่ทักทาย");
  });
});

describe("buildCaptionRequest [S5]", () => {
  it("รวม length + persona + CTA(text+url) + anti-repeat เข้า system", () => {
    const r = buildCaptionRequest({ base, brand, recentCaptions: ["แคปเก่า A", "แคปเก่า B"] });
    expect(r.system).toContain("300 ตัวอักษร");
    expect(r.system).toContain("หมอมี่ ฟันธงสั้น");
    expect(r.system).toContain("ทักพี่มี่ดูดวงเต็ม");
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
  it("[ตู๋ P1] url spoof (mmv.app.evil) → fail (substring ไม่นับ)", () => {
    expect(validateCaption("ดูที่ https://mmv.app.evil/foo", b()).ok).toBe(false);
  });
  it("url ตรง configured แบบ standalone → ok ; ยาวกว่า configured (/luck) → fail (เป๊ะ)", () => {
    expect(validateCaption("ทักเลย https://mmv.app", b()).ok).toBe(true);
    expect(validateCaption("ดู https://mmv.app/luck วันนี้", b()).ok).toBe(false); // /luck = ไม่ใช่ configured เป๊ะ
  });
  it("ctaUrl ว่าง → ไม่บังคับ url", () => {
    expect(validateCaption("ปังมากแม่", b({ ctaUrl: "" })).ok).toBe(true);
  });
  it("ว่าง → fail", () => {
    expect(validateCaption("   ", b({ ctaUrl: "" })).ok).toBe(false);
  });
});

describe("hasUrlToken [ตู๋ P1] — exact token ไม่ใช่ substring", () => {
  const u = "https://mmv.app";
  it("reject host-continuation (.evil)", () => expect(hasUrlToken("x https://mmv.app.evil/y", u)).toBe(false));
  it("reject path beyond configured (เป๊ะ)", () => expect(hasUrlToken("x https://mmv.app/path", u)).toBe(false));
  it("accept end-of-string", () => expect(hasUrlToken("ดู https://mmv.app", u)).toBe(true));
  it("accept space after", () => expect(hasUrlToken("https://mmv.app นะ", u)).toBe(true));
  it("ไม่มี url → false", () => expect(hasUrlToken("ไม่มีลิงก์", u)).toBe(false));
});
