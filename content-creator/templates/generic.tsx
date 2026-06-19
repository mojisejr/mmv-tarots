/**
 * template: generic — "type อะไรก็ได้" (Phase C generic content engine)
 *
 * imageStrategy = composition: render เอง ผ่าน Satori (next/og) — **ไม่เรียก Gemini/brand ref** (เหมือน daily-7)
 *  - content มาจาก agent (resolveTypeToContent) ที่อ่าน free-text type แล้ว reason เป็น title + blocks
 *  - bg = สุ่มจาก daily-7 bg pool แบบ deterministic ด้วย ctx.seed (post id) → retry/preview ได้ใบเดิม
 *  - blocks 1..5 (hero ≤ 1) วาง fixed geometry + line-clamp (-webkit-box) → ไทยไม่มี space ก็ตัดที่ขอบบรรทัด ไม่ cut-off
 *  - text ทุกตัวถูก normalizeBrandTerms ตั้งแต่ resolve (ก่อน persist) → ภาพไม่หลุดแบรนด์
 *  - caption = แยกต่างหาก (engine genCaption) + CTA บังคับผ่าน brand.ctaUrl
 *
 * NOTE: schema นี้เป็น contract กลางของ Phase C — agent คืน content ตามนี้, route lock templateId="generic"
 *       (agent เลือก template เองไม่ได้ — กัน bypass lifecycle ของ daily-7/random-cards) [too P1.2]
 */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { CompositionTemplate, RenderContext } from "./types";
import { loadBackgroundForSeed } from "../lib/bg-pool";

export const GENERIC_TEMPLATE_ID = "generic";

// visual budget (fixed) — schema + render บังคับตรงกัน [too P2.3]
export const TITLE_MAX = 60;
export const LABEL_MAX = 24;
export const BLOCK_TEXT_MAX = 160;
export const BLOCKS_MIN = 1;
export const BLOCKS_MAX = 5;

export const genericBlockSchema = z.object({
  /** ป้ายสั้น (เช่น "คำตอบ", "เพราะ") — optional */
  label: z.string().trim().min(1).max(LABEL_MAX).optional(),
  text: z.string().trim().min(1).max(BLOCK_TEXT_MAX),
  /** hero = เน้นใหญ่กลางภาพ (เช่น verdict ใช่/ไม่) — มากสุด 1 ; default normal */
  emphasis: z.enum(["hero", "normal"]).default("normal"),
});
export type GenericBlock = z.infer<typeof genericBlockSchema>;

/**
 * GenericContentSchema — strong contract (ไม่ใช่ unknown) [too P1.3].
 * meta = advisory persisted (lowConf/note) เพื่อให้คิว approve โชว์ได้หลัง navigation [too P2-3] — render ไม่ใช้
 */
export const genericContentSchema = z
  .object({
    title: z.string().trim().min(1).max(TITLE_MAX),
    blocks: z.array(genericBlockSchema).min(BLOCKS_MIN).max(BLOCKS_MAX),
    meta: z
      .object({
        lowConf: z.boolean().optional(),
        note: z.string().trim().max(200).optional(),
      })
      .optional(),
  })
  .superRefine((c, ctx) => {
    if (c.blocks.filter((b) => b.emphasis === "hero").length > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "hero block ได้มากสุด 1", path: ["blocks"] });
    }
  });
export type GenericContent = z.infer<typeof genericContentSchema>;

const OUT = 1080;
const FONT_PATH = join(process.cwd(), "assets", "fonts", "NotoSansThai-Bold.ttf");

function loadFont(): ArrayBuffer {
  return new Uint8Array(readFileSync(FONT_PATH)).buffer;
}

/**
 * line-clamp box — ยืนรูปแบบ daily-7 ที่ผ่าน browser-truth [render-fix PR#106]:
 *  - `-webkit-box` + `WebkitLineClamp` → ตัดที่ "ขอบบรรทัด" (graceful + … ไม่ cut-off กลางตัวอักษร)
 *    Satori รุ่นนี้ support (daily-7 ใช้อยู่จริง) ; `overflow:hidden` คุมส่วนเกิน
 *  - `wordBreak:"break-word"` → ไทยไม่มี space แตกบรรทัดได้
 *  - `lineHeight ~1.5` → fontSize ใหญ่ แล้ววรรณยุค/สระเกา (อยู่เหนือ/ใต้ตัว) ไม่ชิด/ทับพยัญชนะ
 *  - `maxHeight` ผูกกับ lineHeight×lines → ให้ "line-clamp" เป็นตัวตัด ไม่ใช่ overflow ตัดก่อน (กัน cut-off)
 * เลิกใช้ char-count heuristic (THAI_W เดิมคำนวณความกว้างไทยผิด = สาเหตุ cut-off) → เชื่อ clamp + measure ของ Satori
 */
const clampBox = (fontSize: number, lines: number, color: string, weight = 400, lineHeight = 1.5) =>
  ({
    display: "-webkit-box" as const,
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: lines,
    overflow: "hidden" as const,
    wordBreak: "break-word" as const,
    fontSize,
    fontWeight: weight,
    color,
    lineHeight,
    maxHeight: Math.ceil(fontSize * lineHeight * lines) + 6,
  });

export const generic: CompositionTemplate = {
  id: GENERIC_TEMPLATE_ID,
  name: "เจเนอริก (type อะไรก็ได้ · หมอมี่)",
  inputSchema: genericContentSchema,
  imageStrategy: "composition",
  buildCaptionPrompt(data) {
    const d = genericContentSchema.parse(data);
    const lines = d.blocks.map((b) => (b.label ? `${b.label}: ${b.text}` : b.text)).join("\n");
    return {
      system:
        'คุณคือ "หมอมี่" หมอดูสายฟีลกู้ด พูดน่ารักเป็นกันเอง เรียกตัวเองว่า "พี่มี่" เสมอ (ห้าม "พี่หมี่"). คำติดปาก: ฟีลลิ่ง, ซัพพอร์ต, ปังมาก, แม่. ' +
        "เขียนแคปชั่น Facebook สั้นกระชับ (2-3 ประโยค) จากเนื้อหาด้านล่าง เชิญชวนให้คนอ่าน+ดูดวงต่อ. จบด้วย #หมอมี่ (CTA link จะถูกเติมให้)",
      prompt: `หัวข้อ: ${d.title}\n${lines}\n\nเขียนแคปชั่นเชิญชวน:`,
    };
  },
  async renderImage(data, ctx: RenderContext): Promise<Uint8Array> {
    const d = genericContentSchema.parse(data);
    const { bytes } = loadBackgroundForSeed(ctx.seed);
    const bgUri = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;

    const response = new ImageResponse(
      (
        <div style={{ width: OUT, height: OUT, display: "flex", position: "relative", fontFamily: "Noto Sans Thai" }}>
          {/* bg */}
          <img src={bgUri} width={OUT} height={OUT} style={{ position: "absolute", top: 0, left: 0, width: OUT, height: OUT, objectFit: "cover" }} />

          {/* overlay column */}
          <div style={{ position: "absolute", top: 0, left: 0, width: OUT, height: OUT, display: "flex", flexDirection: "column", alignItems: "center", padding: 56 }}>
            {/* title panel — fontSize 36 + lineHeight 1.4 + line-clamp 2 (ลดจาก 44 ; กัน tone-mark ชิด/cut-off) */}
            <div style={{ display: "flex", maxWidth: 940, backgroundColor: "rgba(74,44,90,0.82)", borderRadius: 22, padding: "16px 30px" }}>
              <div style={{ ...clampBox(36, 2, "#FFFFFF", 700, 1.4), width: 860, textAlign: "center" }}>{d.title}</div>
            </div>

            {/* spacer บน → blocks อยู่กลาง สมดุลบน-ล่าง */}
            <div style={{ display: "flex", flex: 1 }} />

            {/* blocks (1..5) — fixed geometry: hero ใหญ่กลาง, normal เป็น row label+text */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              {d.blocks.map((b, i) =>
                b.emphasis === "hero" ? (
                  // hero — fontSize 40 (ลดจาก 56 ที่ล้น) + lineHeight 1.45 + line-clamp 2
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 900, maxHeight: 240, overflow: "hidden", backgroundColor: "rgba(255,240,245,0.92)", border: "3px solid #E8A0B8", borderRadius: 26, padding: "22px 30px", marginBottom: 16 }}>
                    {b.label ? <div style={{ ...clampBox(24, 1, "#8B4B6B", 700, 1.4), maxWidth: 760, textAlign: "center", marginBottom: 8 }}>{b.label}</div> : null}
                    <div style={{ ...clampBox(40, 2, "#6E2F50", 700, 1.45), width: 820, textAlign: "center" }}>{b.text}</div>
                  </div>
                ) : (
                  // normal — fontSize 24 (ลดจาก 26) + lineHeight 1.5 + line-clamp 2 ; row สูงขึ้นรับ lineHeight
                  <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "center", width: 900, minHeight: 80, maxHeight: 150, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.84)", borderRadius: 16, padding: "14px 18px", marginBottom: 12 }}>
                    {b.label ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minWidth: 120, maxWidth: 220, height: 52, flexShrink: 0, overflow: "hidden", backgroundColor: "#7B4FC9", borderRadius: 12, marginRight: 14, padding: "0 12px" }}>
                        <div style={{ ...clampBox(22, 1, "#FFFFFF", 700, 1.4), maxWidth: 196, textAlign: "center" }}>{b.label}</div>
                      </div>
                    ) : null}
                    <div style={{ display: "flex", flex: 1, minWidth: 0, overflow: "hidden" }}>
                      <div style={{ ...clampBox(24, 2, "#3D2B52", 400, 1.5), width: "100%" }}>{b.text}</div>
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* spacer ล่าง (เท่าบน) → blocks กึ่งกลาง ; footer ติดล่าง */}
            <div style={{ display: "flex", flex: 1 }} />
            <div style={{ display: "flex", backgroundColor: "rgba(74,44,90,0.82)", borderRadius: 100, padding: "10px 24px" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>ดูดวงเจาะลึกรายบุคคล · ทักหมอมี่</span>
            </div>
          </div>
        </div>
      ),
      { width: OUT, height: OUT, fonts: [{ name: "Noto Sans Thai", data: loadFont(), style: "normal", weight: 700 }] },
    );
    return new Uint8Array(await response.arrayBuffer());
  },
};
