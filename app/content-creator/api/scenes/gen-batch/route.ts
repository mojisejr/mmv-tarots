/** POST /content-creator/api/scenes/gen-batch {count?} — gen N scenes → PENDING [PR#105 ก้อน2]
 *  ช้า (Gemini × N) — admin tool local รอได้. fail loud (ไม่ fallback). */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";
import { genSceneBatch } from "@/content-creator/scene-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800; // gen หลายภาพ ใช้เวลานาน
const Body = z.object({ count: z.number().int().min(1).max(24).optional() });

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  let count = 8;
  try { count = Body.parse(await request.json().catch(() => ({}))).count ?? 8; } catch { /* default */ }
  try {
    const r = await genSceneBatch(getContentDb(), count);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
