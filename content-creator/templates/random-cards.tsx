/**
 * random-cards template [PR#103] — สุ่มไพ่ทาโรต์ 3 ใบ + ตีความสถานการณ์ (แม่หมอ Mimi)
 *
 * imageStrategy = "hybrid":
 *   AI scene (แมว Mimi + บรรยากาศ tarot, NO text/cards) → renderComposite วางไพ่จริง 3 ใบ + ข้อความไทยทับ.
 *   ไพ่ถูก draw + persist (cardIds) ตั้งแต่ draft (ก่อน paid) → render/replay ใช้ไพ่ชุดเดิม [ตู๋ P1].
 *   ข้อความไทยทั้งหมดมาจาก composition (next/og) เท่านั้น — AI scene ห้ามมีตัวอักษร (กันไทยมั่ว) [ตู๋ P1].
 */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { CaptionPrompt, RenderContext } from "./types";
import { selectCardById, loadCardBytes } from "../lib/card-pool";

export const RANDOM_CARDS_TEMPLATE_ID = "random-cards";
const OUT = 1080;
const FONT_PATH = join(process.cwd(), "assets", "fonts", "NotoSansThai-Bold.ttf");
const HEADER = "ไพ่ทาโรต์บอกคุณว่า";
const FOOTER = "แม่หมอ Mimi";

/** FinalInput ของ random-cards — cardIds (3 ใบ unique, persist) + ข้อความที่ตีความไว้ตอน draft */
export const randomCardsSchema = z
  .object({
    cardIds: z.array(z.string().min(1)).length(3),
    quote: z.string().min(1).max(110), // คำพูดสั้นเด่น — hard cap (fit-by-design D3: เกิน→regen สั้นลง ไม่ปล่อยล้น)
    body: z.string().min(1).max(260), // ตีความ — hard cap (fit container โปร่งที่ font 23 ไม่ clip)
  })
  .superRefine((d, ctx) => {
    if (new Set(d.cardIds).size !== d.cardIds.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "cardIds ต้องไม่ซ้ำ (3 ใบ)" });
  });
export type RandomCardsInput = z.infer<typeof randomCardsSchema>;

function loadFont(): ArrayBuffer {
  return new Uint8Array(readFileSync(FONT_PATH)).buffer;
}
const dataUri = (bytes: Uint8Array, mime: string) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

// font sizes (ก้อน 5 / D3: ลด ~10-15% จาก baseline ตามที่ฟีมสั่ง — fit เนื้อหามากขึ้น)
const QUOTE_FS = 34; // เดิม 40
const BODY_FS = 23; // เดิม 27
const THAI_W = 0.52; // สัดส่วนความกว้างตัวอักษร NotoSansThai-Bold โดยประมาณ (heuristic — Satori ไม่มี font-metric ตอน pre-render)

/**
 * measure-based fit cap (D3) [ก้อน 5]: budget = lines × (width / (fontSize·THAI_W)) → คำนวณจาก container จริง
 * ไม่ใช่ blind char-count. content ปกติ (genReading ตั้งเป้า quote≤110/body≤280) จะ fit ไม่ถูกตัด ;
 * เฉพาะ pathological (no-space ยาวสุด) ถึง cap + … ให้พอดี container.
 */
function fitCap(text: string, width: number, fontSize: number, lines: number): string {
  const perLine = Math.max(1, Math.floor(width / (fontSize * THAI_W)));
  const budget = perLine * lines;
  return text.length > budget ? `${text.slice(0, budget - 1)}…` : text;
}
/**
 * text box ที่ fit จริงใน Satori (D3): explicit maxHeight + overflow hidden (Satori **ไม่ support**
 * -webkit-line-clamp → เดิมเป็น dead code → text ล้นทับไพ่/footer). + wordBreak (no-space Thai แตกบรรทัด).
 */
const fitBox = (maxHeight: number, fontSize: number, color: string, weight = 400) => ({
  maxHeight,
  overflow: "hidden" as const,
  wordBreak: "break-word" as const,
  fontSize,
  fontWeight: weight,
  color,
  textAlign: "center" as const,
  lineHeight: 1.4,
});

export const randomCardsTemplate = {
  id: RANDOM_CARDS_TEMPLATE_ID,
  name: "สุ่มไพ่ทาโรต์ 3 ใบ (แม่หมอ Mimi)",
  imageStrategy: "hybrid" as const,
  inputSchema: randomCardsSchema,

  /** ฉาก AI: แมว Mimi + บรรยากาศ tarot + เว้นที่วางไพ่ — ห้ามมีข้อความ/ไพ่ (มาจาก composition) */
  buildImagePrompt(): string {
    return (
      "ฉากโต๊ะดูดวงทาโรต์ บรรยากาศห้อง cozy mystic อบอุ่น มีเทียนจุด คริสตัล/หินสีพาสเทล ดอกไม้แห้งสีพีช " +
      "ธูปควันบางๆ โทนพีช-ชมพู-ลาเวนเดอร์ นุ่มนวล สวยงาม aesthetic. " +
      "**วางแมวหมอดูไว้มุมบน (ขวาบนหรือซ้ายบน) ขนาดพอเห็นชัดเป็นตัวเด่นของแบรนด์ — แต่อยู่ชิดมุมบนเท่านั้น ห้ามล้ำลงมากลางหรือล่างของภาพ**. " +
      "**ครึ่งกลางและล่างของภาพต้องเป็นพื้นโต๊ะโล่ง ๆ เรียบ ไม่มี object เด่นบัง (สำหรับวางไพ่+ข้อความภายหลัง)**. " +
      "ห้ามวาดไพ่ใด ๆ. ภาพจัตุรัส 1:1."
    );
  },

  buildCaptionPrompt(data: unknown): CaptionPrompt {
    const d = randomCardsSchema.parse(data);
    const cards = d.cardIds.map((id) => selectCardById(id)).map((c) => `${c.nameTh} (${c.nameEn})`).join(", ");
    return {
      system:
        "เขียนแคปชั่นโพสต์เพจดูดวงโทนอบอุ่นเป็นกันเอง persona 'แม่หมอ Mimi' (แมวหมอดู). ห้ามใส่ชื่อไพ่ผิด. " +
        "**กระชับ ไม่เกิน 350 ตัวอักษร** (2-4 บรรทัดสั้น ๆ) — เน้นเชิญชวน+ให้กำลังใจ ไม่ต้องเล่าซ้ำคำทำนายทั้งหมด.",
      prompt: `ไพ่ที่จั่วได้ 3 ใบ: ${cards}\nคำพูดสั้น: ${d.quote}\nสรุปคำทำนาย: ${d.body}\n\nเขียนแคปชั่น FB สั้นกระชับ (≤350 ตัวอักษร) เชิญชวนอ่านดวง + อบอุ่นให้กำลังใจ.`,
    };
  },

  /** วาง composition (ไพ่จริง + ข้อความไทย) ทับ AI scene → ภาพ final 1080x1080 */
  async renderComposite(data: unknown, _ctx: RenderContext, scene: Uint8Array): Promise<Uint8Array> {
    const d = randomCardsSchema.parse(data);
    const bg = dataUri(scene, "image/png");
    const cards = d.cardIds.map((id) => dataUri(loadCardBytes(selectCardById(id)), "image/png"));

    const el = (
      <div style={{ width: OUT, height: OUT, display: "flex", position: "relative", fontFamily: "Noto Sans Thai" }}>
        <img src={bg} width={OUT} height={OUT} style={{ position: "absolute", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: OUT, height: OUT, display: "flex", flexDirection: "column", alignItems: "center", padding: 48 }}>
          {/* header — บนสุด */}
          <div style={{ display: "flex", background: "rgba(255,240,245,0.92)", borderRadius: 28, padding: "12px 38px", border: "3px solid #E8A0B8" }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: "#8B4B6B" }}>{HEADER}</span>
          </div>
          {/* D5: spacer บน — เกลี่ย vertical budget ให้ middle group (quote/cards/body) อยู่กลาง สมดุลบน-ล่าง */}
          <div style={{ display: "flex", flex: 1 }} />
          {/* quote — fit box (maxHeight + overflow hidden, ไม่พึ่ง line-clamp) [D3] */}
          <div style={{ display: "flex", width: 860, justifyContent: "center", overflow: "hidden" }}>
            <div style={fitBox(150, QUOTE_FS, "#6E2F50", 700)}>{fitCap(d.quote, 800, QUOTE_FS, 3)}</div>
          </div>
          {/* panel รองหลังไพ่ — การันตีไพ่เด่นทุก AI scene [ตู๋ PR#103 P2] ; D4: วางตรง gap เท่า (drop rotate) */}
          <div style={{ display: "flex", marginTop: 24, background: "rgba(74,42,58,0.42)", borderRadius: 24, padding: "22px 26px" }}>
            {cards.map((c, i) => (
              <img key={i} src={c} width={196} height={336} style={{ objectFit: "cover", borderRadius: 12, border: "4px solid #fff", marginLeft: i ? 22 : 0 }} />
            ))}
          </div>
          {/* body — fit box (maxHeight 6 บรรทัด + overflow hidden) [D3] */}
          <div style={{ display: "flex", width: 880, marginTop: 24, background: "rgba(255,248,240,0.93)", borderRadius: 20, padding: "20px 32px", justifyContent: "center", overflow: "hidden" }}>
            <div style={fitBox(208, BODY_FS, "#6B4555")}>{fitCap(d.body, 816, BODY_FS, 6)}</div>
          </div>
          {/* D5: spacer ล่าง (เท่ากับบน) → middle group กึ่งกลาง ; footer ติดล่าง */}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", background: "rgba(110,47,80,0.55)", borderRadius: 24, padding: "8px 30px" }}>
            <span style={{ fontSize: 38, fontWeight: 700, color: "#FFF" }}>{FOOTER}</span>
          </div>
        </div>
      </div>
    );

    const resp = new ImageResponse(el, { width: OUT, height: OUT, fonts: [{ name: "Noto Sans Thai", data: loadFont(), style: "normal", weight: 700 }] });
    return new Uint8Array(await resp.arrayBuffer());
  },
};
