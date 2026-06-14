/**
 * /content-creator/api/brand — อ่าน/แก้ Brand Profile หมอมี่ [S3.5b/c]
 * GET  → brand profile ปัจจุบัน (merge DEFAULT)
 * PUT  → แก้ stylePrompt / captionPersona (ฟีมปรับ theme/tone เอง)
 * อยู่ใต้ /content-creator/* → middleware guard ครอบ + เช็ค enabled ซ้ำ
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContentDb } from "@/content-creator/db/client";
import { getBrandProfile, updateBrandProfile } from "@/content-creator/db/brand";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  const b = getBrandProfile(getContentDb());
  return NextResponse.json({
    brand: { stylePrompt: b.stylePrompt, captionPersona: b.captionPersona, refImagePath: b.refImagePath, imageModel: b.imageModel },
  });
}

const PatchSchema = z.object({
  stylePrompt: z.string().max(4000).optional(),
  captionPersona: z.string().max(4000).optional(),
});

export async function PUT(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });
  let patch: z.infer<typeof PatchSchema>;
  try {
    patch = PatchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const b = updateBrandProfile(getContentDb(), patch);
  return NextResponse.json({ ok: true, brand: { stylePrompt: b.stylePrompt, captionPersona: b.captionPersona } });
}
