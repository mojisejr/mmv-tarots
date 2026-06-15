/**
 * template: daily-7 — "ดวงรายวัน 7 วันเกิด" (หมอมี่) [S6b]
 *
 * imageStrategy = composition: render ภาพเอง (next/og) — **ไม่เรียก Gemini/brand ref**
 *  - bg = สุ่มจาก pool แบบ deterministic ด้วย ctx.seed (post id) → retry/preview ได้ใบเดิม
 *  - วาง text 7 วัน (จันทร์–อาทิตย์) ด้วย satori + NotoSansThai → ไทยคมชัด (nano banana สะกดไทยมั่ว)
 *  - chip สีประจำวันเกิดไทย (deterministic, ไม่พึ่ง emoji font/CDN) + per-slot panel กัน readability
 *  - caption = แยกต่างหาก (เชิญคนหา "วันเกิดตัวเอง" ในภาพ) + CTA บังคับผ่าน brand.ctaUrl (engine)
 */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { CompositionTemplate, RenderContext } from "./types";
import { loadBackgroundForSeed } from "../lib/bg-pool";

/** ลำดับ canonical (render เรียงนี้เสมอ ไม่ขึ้นกับลำดับ input) */
const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
type Weekday = (typeof WEEKDAYS)[number];

/** สีประจำวันเกิดไทย — คนไทยรู้สีวันเกิดตัวเอง ใช้เป็น cue หา slot ได้เร็ว */
const DAY_COLOR: Record<Weekday, string> = {
  จันทร์: "#E6B400", // เหลือง
  อังคาร: "#E84D8A", // ชมพู/บานเย็น
  พุธ: "#2FA875", // เขียว
  พฤหัสบดี: "#E8862F", // ส้ม
  ศุกร์: "#3E8FCF", // ฟ้า
  เสาร์: "#7B4FC9", // ม่วง
  อาทิตย์: "#E2453F", // แดง
};

export const daily7Schema = z
  .object({
    /** ป้ายวันที่บนหัวการ์ด (optional) เช่น "15 มิ.ย. 68" */
    dateLabel: z.string().min(1).max(40).optional(),
    /** 7 วัน ครบไม่ซ้ำ (จันทร์–อาทิตย์) — canonical FinalInput */
    days: z
      .array(z.object({ day: z.enum(WEEKDAYS), fortune: z.string().min(1).max(200) }))
      .length(7),
  })
  .superRefine((val, ctx) => {
    const set = new Set(val.days.map((d) => d.day));
    if (set.size !== 7) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "days ต้องมีครบ 7 วันไม่ซ้ำ (จันทร์–อาทิตย์)", path: ["days"] });
    }
  });

export type Daily7Input = z.infer<typeof daily7Schema>;

const OUT = 1080; // การ์ดสี่เหลี่ยมจัตุรัส (bg pool เป็น 1:1)
const MAX_FORTUNE = 58; // deterministic truncate → layout นิ่ง (golden stable)
const FONT_PATH = join(process.cwd(), "assets", "fonts", "NotoSansThai-Bold.ttf");

function truncate(s: string, n: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
}

function loadFont(): ArrayBuffer {
  return new Uint8Array(readFileSync(FONT_PATH)).buffer;
}

export const daily7: CompositionTemplate = {
  id: "daily-7",
  name: "ดวงรายวัน 7 วันเกิด (หมอมี่)",
  inputSchema: daily7Schema,
  imageStrategy: "composition",
  buildCaptionPrompt(data) {
    const d = daily7Schema.parse(data);
    return {
      system:
        'คุณคือ "หมอมี่" หมอดูสายฟีลกู้ด พูดน่ารักเป็นกันเอง (พี่หมี่, ฟีลลิ่ง, ซัพพอร์ต, ปังมาก, แม่). ' +
        "เขียนแคปชั่น Facebook สำหรับ 'ดวงรายวัน 7 วันเกิด' สั้นกระชับ ชวนให้คนมองหา 'วันเกิดของตัวเอง' ในภาพ " +
        "และดูว่าวันนี้ของเขาเป็นยังไง. จบด้วย #ดวงรายวัน #หมอมี่ (CTA link จะถูกเติมให้)",
      prompt: `วันนี้${d.dateLabel ? ` (${d.dateLabel})` : ""} เปิดดวงครบทั้ง 7 วันเกิด\nเขียนแคปชั่นเชิญชวน:`,
    };
  },
  async renderImage(data, ctx: RenderContext): Promise<Uint8Array> {
    const d = daily7Schema.parse(data);
    const { bytes } = loadBackgroundForSeed(ctx.seed);
    const bgUri = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;

    const byDay = new Map(d.days.map((x) => [x.day, x.fortune] as const));
    const rows = WEEKDAYS.map((day) => ({ day, color: DAY_COLOR[day], fortune: truncate(byDay.get(day) ?? "", MAX_FORTUNE) }));

    const response = new ImageResponse(
      (
        <div style={{ width: OUT, height: OUT, display: "flex", position: "relative", fontFamily: "Noto Sans Thai" }}>
          {/* bg layer (เต็มภาพ) */}
          <img src={bgUri} width={OUT} height={OUT} style={{ position: "absolute", top: 0, left: 0, width: OUT, height: OUT, objectFit: "cover" }} />

          {/* overlay content — column ซ้าย ~63% เว้นขวาให้หมอมี่โผล่ */}
          <div style={{ position: "absolute", top: 0, left: 0, width: OUT, height: OUT, display: "flex", flexDirection: "column", padding: 46 }}>
            {/* title panel */}
            <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", backgroundColor: "rgba(74,44,90,0.82)", borderRadius: 22, padding: "16px 26px", marginBottom: 18 }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#FFFFFF" }}>ดวงรายวัน 7 วันเกิด</div>
              {d.dateLabel ? <div style={{ display: "flex", fontSize: 24, color: "#FFD9F0", marginTop: 4 }}>{d.dateLabel}</div> : null}
            </div>

            {/* 7 day rows (ซ้าย) */}
            <div style={{ display: "flex", flexDirection: "column", width: "64%" }}>
              {rows.map((r) => (
                <div key={r.day} style={{ display: "flex", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 16, padding: "9px 12px", marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 132, height: 46, flexShrink: 0, backgroundColor: r.color, borderRadius: 12, marginRight: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>{r.day}</span>
                  </div>
                  <div style={{ display: "flex", flex: 1, fontSize: 23, color: "#3D2B52", lineHeight: 1.2 }}>{r.fortune}</div>
                </div>
              ))}
            </div>

            {/* footer panel */}
            <div style={{ display: "flex", alignSelf: "flex-start", backgroundColor: "rgba(74,44,90,0.82)", borderRadius: 100, padding: "10px 22px", marginTop: 14 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>ดูดวงเจาะลึกรายบุคคล · ทักหมอมี่</span>
            </div>
          </div>
        </div>
      ),
      { width: OUT, height: OUT, fonts: [{ name: "Noto Sans Thai", data: loadFont(), style: "normal", weight: 700 }] }
    );
    return new Uint8Array(await response.arrayBuffer());
  },
};
