/**
 * GET /content-creator/api/daily7-preview — render daily-7 สดให้ดู (dev playground) [S6b browser-truth]
 *
 * ไม่แตะ DB / ไม่เรียก Gemini / ไม่ต้องตั้ง CTA — เรียก renderImage ตรง ๆ (path ที่ ship จริง)
 * query: ?d=<base64(utf8 json ของ Daily7Input)>  ?seed=<string>  (ไม่ส่ง → sample)
 * dev-only: prod → 404 (กันโผล่ public)
 */
import { NextResponse } from "next/server";
import { daily7, daily7Schema, type Daily7Input } from "@/content-creator/templates/daily7";
import { DEFAULT_BRAND } from "@/content-creator/db/brand";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE: Daily7Input = {
  targetDate: "2026-06-15",
  days: [
    { day: "จันทร์", fortune: "การงานไหลลื่น เจ้านายเอ็นดู มีโอกาสได้งานใหม่" },
    { day: "อังคาร", fortune: "ระวังปากเสียงกับคนใกล้ตัว ใจเย็นไว้" },
    { day: "พุธ", fortune: "การเงินคล่องตัว มีรายได้เสริมเข้ามา" },
    { day: "พฤหัสบดี", fortune: "ความรักสดใส คนโสดมีเกณฑ์เจอคนถูกใจ" },
    { day: "ศุกร์", fortune: "สุขภาพดี พลังงานเต็มเปี่ยม เหมาะเริ่มสิ่งใหม่" },
    { day: "เสาร์", fortune: "มีโชคลาภเล็กๆ จากผู้ใหญ่ ลองเสี่ยงดู" },
    { day: "อาทิตย์", fortune: "ได้พักผ่อนเต็มที่ ครอบครัวอบอุ่น ใจสงบ" },
  ],
};

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" || !isContentCreatorEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const d = searchParams.get("d");
  const seed = searchParams.get("seed") || "playground";

  let input: Daily7Input = SAMPLE;
  if (d) {
    try {
      input = daily7Schema.parse(JSON.parse(Buffer.from(decodeURIComponent(d), "base64").toString("utf8")));
    } catch (err) {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 400 });
    }
  }

  // daily7 composition ไม่ใช้ brand แต่ RenderContext.brand type ต้องครบ — เติม updatedAt
  const bytes = await daily7.renderImage(input, { brand: { ...DEFAULT_BRAND, updatedAt: new Date() }, seed });
  return new NextResponse(new Uint8Array(bytes), {
    headers: { "content-type": "image/png", "cache-control": "no-store" },
  });
}
