/**
 * POST /content-creator/api/daily7-preview — render daily-7 สดให้ดู (dev preview) [S6c.2]
 * body: { targetDate, backgroundId?, days:[{day,fortune}] } → PNG (image/png)
 *
 * ใช้ POST+body (ไม่ใช่ GET+base64-URL ที่เปราะเรื่อง length/encoding — เคยทำ preview ไม่ขึ้น).
 * client fetch → blob → objectURL. ไม่แตะ DB/ไม่เรียก Gemini (renderImage path จริง). dev-only.
 */
import { NextResponse } from "next/server";
import { daily7, daily7Schema } from "@/content-creator/templates/daily7";
import { DEFAULT_BRAND } from "@/content-creator/db/brand";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || !isContentCreatorEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  let input: import("@/content-creator/templates/daily7").Daily7Input;
  try {
    input = daily7Schema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
  const bytes = await daily7.renderImage(input, { brand: { ...DEFAULT_BRAND, updatedAt: new Date() }, seed: "preview" });
  return new NextResponse(new Uint8Array(bytes), { headers: { "content-type": "image/png", "cache-control": "no-store" } });
}
