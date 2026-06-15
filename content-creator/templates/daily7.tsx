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
import { loadBackgroundForSeed, loadBackgroundById } from "../lib/bg-pool";
import { genObject } from "../lib/gemini";

/** ลำดับ canonical (render เรียงนี้เสมอ ไม่ขึ้นกับลำดับ input) */
export const WEEKDAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"] as const;
type Weekday = (typeof WEEKDAYS)[number];

/**
 * ISO date ที่เป็น "วันปฏิทินจริง" (ไม่ใช่แค่ \d{4}-\d{2}-\d{2}) — กัน 2026-99-99 / 2026-02-30
 * หลุดเข้า paid gen + label undefined [ตู๋ P1.3]. UTC round-trip → deterministic ไม่พึ่ง tz.
 */
export function isValidIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PREDICTION = 200; // content cap ต่อวัน (visual ถูก clip ด้วย geometry อีกชั้น)

const dayFortuneSchema = z.object({ day: z.enum(WEEKDAYS), fortune: z.string().min(1).max(MAX_PREDICTION) });

/**
 * FinalInput (canonical) — สิ่งที่ persist ใน contentPost.inputData + ใช้ render [S6c ตู๋].
 *  - targetDate (ISO, freeze เวลากรุงเทพตอนสร้าง) — renderer derive Thai dateLabel เอง deterministic
 *    (ไม่เก็บ dateLabel แก้มือ — กัน label ไม่ตรง date)
 *  - backgroundId (optional) — finalize set ให้เสมอ → render by-id (ปลดล็อกขยาย pool) ;
 *    ไม่มี → fallback seed hash (back-compat S6b path)
 *  - days ครบ 7 ไม่ซ้ำ (จันทร์–อาทิตย์)
 */
export const daily7Schema = z
  .object({
    targetDate: z.string().regex(ISO_DATE, "targetDate ต้องเป็น YYYY-MM-DD").refine(isValidIsoDate, "targetDate ไม่ใช่วันปฏิทินจริง"),
    backgroundId: z.string().min(1).optional(),
    days: z.array(dayFortuneSchema).length(7),
  })
  .superRefine((val, ctx) => {
    const set = new Set(val.days.map((d) => d.day));
    if (set.size !== 7) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "days ต้องมีครบ 7 วันไม่ซ้ำ (จันทร์–อาทิตย์)", path: ["days"] });
    }
  });

export type Daily7Input = z.infer<typeof daily7Schema>;
export type DayFortune = { day: Weekday; fortune: string };

/** เดือนไทยย่อ — derive Thai dateLabel จาก ISO date แบบ deterministic (ไม่พึ่ง timezone/locale ระบบ) */
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export function deriveThaiDateLabel(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) throw new Error(`targetDate ไม่ใช่วันปฏิทินจริง: ${isoDate}`);
  const [y, mo, d] = isoDate.split("-").map(Number);
  const be2 = String((y + 543) % 100).padStart(2, "0"); // ปี พ.ศ. 2 หลักท้าย
  return `${d} ${THAI_MONTHS[mo - 1]} ${be2}`;
}

/**
 * canonicalize ผล gen → 7 วันเรียง canonical, trim, ไม่ว่าง, ครบ/ไม่ซ้ำ. ผิด → throw [ตู๋ P1.B].
 * (ไม่ patch ทีละ slot — caller regen ทั้งชุดถ้าไม่ผ่าน)
 */
export function canonicalizeDays(raw: { day: string; fortune: string }[]): DayFortune[] {
  const map = new Map<string, string>();
  for (const r of raw) {
    const f = (r.fortune ?? "").trim().replace(/\s+/g, " ");
    if (!f) throw new Error(`คำทำนายว่าง: ${r.day}`);
    map.set(r.day, f.slice(0, MAX_PREDICTION));
  }
  return WEEKDAYS.map((day) => {
    const fortune = map.get(day);
    if (!fortune) throw new Error(`ขาดวัน/ซ้ำ: ${day} (ต้องครบ 7 วันไม่ซ้ำ)`);
    return { day, fortune };
  });
}

/** schema ที่ model ต้องคืน (structured output) — gen 7 วันทั้งชุดครั้งเดียว */
const draftGenSchema = z.object({ days: z.array(z.object({ day: z.enum(WEEKDAYS), fortune: z.string() })).length(7) });

const DRAFT_SYSTEM =
  'คุณคือ "หมอมี่" หมอดูสายฟีลกู้ดน่ารักเป็นกันเอง. เขียน "ดวงรายวัน" ภาพรวมของแต่ละวันเกิด ' +
  "(จันทร์ อังคาร พุธ พฤหัสบดี ศุกร์ เสาร์ อาทิตย์) ว่าวันนี้โดยรวมเป็นยังไง — สั้นกระชับ 1 ประโยค " +
  "ต่อวัน ฟันธงชัด ฟีลบวก ครบทั้ง 7 วัน ไม่ซ้ำ. แต่ละวันยาวไม่เกิน ~80 ตัวอักษร.";

/**
 * gen 7 คำทำนาย overall (1 call) + validate strict ; ไม่ผ่าน → regen ทั้งชุด 1 ครั้งพร้อม feedback →
 * ยังไม่ผ่าน throw (caller → FAILED) [ตู๋ P1.B]
 */
export async function genDaily7Days(targetDate: string): Promise<DayFortune[]> {
  const label = deriveThaiDateLabel(targetDate);
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const system = attempt === 0 ? DRAFT_SYSTEM : `${DRAFT_SYSTEM}\n\n(รอบก่อนไม่ผ่าน: ${lastErr} — แก้ให้ครบ 7 วันไม่ซ้ำ ไม่มีช่องว่าง)`;
    const obj = await genObject({ schema: draftGenSchema, system, prompt: `วันที่ ${label}: เขียนดวงรายวันภาพรวมครบ 7 วันเกิด` });
    try {
      return canonicalizeDays(obj.days);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`gen 7 วันไม่ผ่านกติกาหลัง regen: ${lastErr}`);
}

const OUT = 1080; // การ์ดสี่เหลี่ยมจัตุรัส (bg pool เป็น 1:1)
const ROW_H = 88; // ความสูง slot คงที่ → layout golden นิ่งไม่ว่าคำทำนายยาว/สั้น
const MAX_FORTUNE = 58; // deterministic truncate (content guard) — visual ถูก clip ด้วย geometry อีกชั้น
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
      prompt: `วันที่ ${deriveThaiDateLabel(d.targetDate)} เปิดดวงครบทั้ง 7 วันเกิด\nเขียนแคปชั่นเชิญชวน:`,
    };
  },
  async renderImage(data, ctx: RenderContext): Promise<Uint8Array> {
    const d = daily7Schema.parse(data);
    // by-id (finalized) → ผลคงที่ถาวร ปลดล็อกขยาย pool ; ไม่มี id → fallback seed hash (S6b path)
    const { bytes } = d.backgroundId ? loadBackgroundById(d.backgroundId) : loadBackgroundForSeed(ctx.seed);
    const bgUri = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
    const dateLabel = deriveThaiDateLabel(d.targetDate);

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
              <div style={{ display: "flex", fontSize: 24, color: "#FFD9F0", marginTop: 4 }}>{dateLabel}</div>
            </div>

            {/* 7 day rows (ซ้าย) — fixed geometry กัน worst-case Thai ไม่มี space ล้น panel [ตู๋ P1]:
                row สูงคงที่ + overflow hidden ; text cell minWidth:0 (ยอมหดต่ำกว่า content — กัน flex
                overflow) + wordBreak (no-space Thai แตกบรรทัดได้) + line-clamp 2 + overflow hidden */}
            <div style={{ display: "flex", flexDirection: "column", width: "64%" }}>
              {rows.map((r) => (
                <div key={r.day} style={{ display: "flex", flexDirection: "row", alignItems: "center", height: ROW_H, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 16, padding: "0 12px", marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 132, height: 46, flexShrink: 0, backgroundColor: r.color, borderRadius: 12, marginRight: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>{r.day}</span>
                  </div>
                  <div style={{ display: "flex", flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        fontSize: 22,
                        color: "#3D2B52",
                        lineHeight: 1.25,
                        wordBreak: "break-word",
                      }}
                    >
                      {r.fortune}
                    </div>
                  </div>
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
