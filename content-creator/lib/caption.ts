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
  const rules: string[] = [
    // length = upper bound ; ความยาว/ความน่าอ่าน คุมด้วย persona (ไม่บังคับ "สั้น")
    `ความยาวไม่เกิน ${brand.captionMaxChars} ตัวอักษร (นับรวมอิโมจิ/ลิงก์) — เขียนให้พอเหมาะ มีเนื้อหาให้อ่านได้สาระ อ่านจบในทีเดียว ไม่ห้วนและไม่ยืดเยื้อ`,
  ];

  if (brand.captionPersona) rules.push(`โทน/เปอร์โซน่า: ${brand.captionPersona}`);

  // CTA บังคับ — ชวนเข้าใช้ระบบ ; เรียบเรียงให้เข้ากับบริบทคำทำนายโพสต์นี้ (ไม่ผูกหัวข้อตายตัว → reuse ข้าม template) ; url เป๊ะ
  if (brand.ctaText || brand.ctaUrl) {
    let cta =
      "**ต้องจบด้วยประโยคชวนเข้าใช้ระบบเสมอ** — เรียบเรียงใหม่ทุกครั้งให้ **สอดคล้องกับไพ่/ดวง/หัวข้อที่โพสต์นี้พูดถึง** (อิงบริบทด้านบน ไม่ใช้คำ generic แข็ง ไม่ซ้ำของเดิม)";
    if (brand.ctaText) cta += ` สื่อความทำนองว่า: "${brand.ctaText}"`;
    if (brand.ctaUrl) cta += ` แล้วตามด้วยลิงก์ ${brand.ctaUrl} (พิมพ์ลิงก์นี้เป๊ะ ห้ามแก้/ต่อ path)`;
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

// ตัวอักษรที่ "ต่อ" เป็นส่วนหนึ่งของ URL ได้ — ขอบ url (หน้า-หลัง) ต้องไม่ใช่ตัวพวกนี้
const URL_CONT = /[\w.\-~:/?#[\]@!$&'()*+,;=%]/;

/**
 * caption มี ctaUrl เป็น "token เป๊ะ" (standalone) ไหม — กันทั้ง:
 *   - substring spoof: `https://mmv.app.evil/x` ไม่นับว่ามี `https://mmv.app`
 *   - URL ยาวกว่า configured: `https://mmv.app/luck` ไม่นับว่ามี `https://mmv.app` เป๊ะ [ตู๋]
 * → ขอบหน้า-หลังของ url ต้องไม่ใช่ URL-continuation char (เป็น whitespace/วรรค/จบ เท่านั้น)
 */
export function hasUrlToken(text: string, url: string): boolean {
  if (!url) return false;
  for (let from = 0; ; ) {
    const i = text.indexOf(url, from);
    if (i < 0) return false;
    const before = i > 0 ? text[i - 1] : "";
    const after = text[i + url.length] ?? "";
    if (!URL_CONT.test(before) && !URL_CONT.test(after)) return true; // standalone เป๊ะ
    from = i + 1; // เป็นส่วนของ url อื่น → หาต่อ
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
