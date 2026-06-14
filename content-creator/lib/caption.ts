/**
 * caption finetune [S5] — ประกอบ caption request + validate ตาม brand:
 *  - ฟันธงสั้น ≤ captionMaxChars
 *  - CTA ชวนเข้าใช้ระบบ (บังคับแนบทุกครั้ง — ฟีมห้ามลืม)
 *  - ไม่ซ้ำจำเจ: feed caption เก่า N อันเข้า prompt → model เลี่ยงซ้ำ
 */
import type { BrandProfile } from "../db/schema";
import type { CaptionPrompt } from "../templates/types";

export type CaptionBrand = Pick<BrandProfile, "captionPersona" | "captionMaxChars" | "ctaText" | "ctaUrl">;

export interface CaptionContext {
  base: CaptionPrompt; // จาก template.buildCaptionPrompt
  brand: CaptionBrand;
  recentCaptions: string[]; // anti-repeat (N ล่าสุด)
}

/** ประกอบ caption request — persona + length + CTA + anti-repeat รวมเข้า system */
export function buildCaptionRequest(ctx: CaptionContext): CaptionPrompt {
  const { base, brand, recentCaptions } = ctx;
  const rules: string[] = [`เขียนสั้น กระชับ ฟันธงชัด ไม่เกิน ${brand.captionMaxChars} ตัวอักษร (นับรวมอิโมจิ/ลิงก์ทุกอย่าง)`];

  if (brand.captionPersona) rules.push(`โทน/เปอร์โซน่า: ${brand.captionPersona}`);

  // CTA บังคับ — ชวนเข้าใช้ระบบ (เรียบเรียงใหม่ทุกครั้ง ; url พิมพ์เป๊ะ)
  if (brand.ctaText || brand.ctaUrl) {
    let cta = `**ต้องจบด้วยประโยคชวนเข้าใช้ระบบเสมอ** (เรียบเรียงคำใหม่ทุกครั้ง ไม่ก็อปเป๊ะ ไม่ซ้ำของเดิม)`;
    if (brand.ctaText) cta += ` สื่อความว่า: "${brand.ctaText}"`;
    if (brand.ctaUrl) cta += ` แล้วตามด้วยลิงก์ ${brand.ctaUrl} (พิมพ์ลิงก์นี้เป๊ะ ห้ามแก้)`;
    rules.push(cta);
  }

  // anti-repeat — feed history
  if (recentCaptions.length) {
    rules.push(
      "ห้ามซ้ำแนว/คำเปิด/วิธีชวนของแคปชั่นก่อนหน้า (ทำให้สดใหม่):\n" +
        recentCaptions.map((c, i) => `(${i + 1}) ${c}`).join("\n"),
    );
  }

  return { system: `${base.system}\n\nกติกาเพิ่มเติม:\n- ${rules.join("\n- ")}`, prompt: base.prompt };
}

export interface CaptionValidation {
  ok: boolean;
  reason?: string;
}

/**
 * caption มี ctaUrl เป็น "token จริง" ไหม — กัน substring spoof (`https://mmv.app.evil/x`
 * ไม่นับว่ามี `https://mmv.app`). ตัวถัดจาก url ต้องไม่ใช่ host-continuation char [A-Za-z0-9.-]
 * (`.evil` = host ต่อ → reject ; `/path` ` ` หรือจบ = ok)
 */
export function hasUrlToken(text: string, url: string): boolean {
  if (!url) return false;
  for (let from = 0; ; ) {
    const i = text.indexOf(url, from);
    if (i < 0) return false;
    const after = text[i + url.length] ?? "";
    if (!/[A-Za-z0-9.\-]/.test(after)) return true; // ขอบ url ถูกต้อง
    from = i + 1; // เจอแต่เป็น prefix ของ host อื่น → หาต่อ
  }
}

/**
 * validate caption ตาม brand — length + CTA.
 * **CTA enforceable = ctaUrl** (token เป๊ะ ตรวจได้) ; ctaText อย่างเดียว model เรียบเรียงใหม่
 * ตรวจไม่ได้ → ถ้าจะบังคับ CTA ต้องตั้ง ctaUrl (settings เตือน). [ตู๋ P1]
 */
export function validateCaption(caption: string, brand: Pick<BrandProfile, "captionMaxChars" | "ctaUrl">): CaptionValidation {
  const text = caption.trim();
  if (text.length === 0) return { ok: false, reason: "caption ว่าง" };
  if (text.length > brand.captionMaxChars) {
    return { ok: false, reason: `ยาวเกิน ${brand.captionMaxChars} ตัวอักษร (ได้ ${text.length})` };
  }
  if (brand.ctaUrl && !hasUrlToken(text, brand.ctaUrl)) {
    return { ok: false, reason: "ขาด CTA link ที่ถูกต้องในแคปชั่น (ต้องมี ctaUrl เป๊ะ)" };
  }
  return { ok: true };
}
