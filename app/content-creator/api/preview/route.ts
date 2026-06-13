/**
 * POST /content-creator/api/preview — build prompt ที่จะส่ง Gemini โดย "ไม่ gen" (ฟรี, cheap) [S3.5a]
 * body: { templateId, inputData } → { captionPrompt: {system, prompt}, imagePrompt }
 * ให้ฟีมเห็น prompt จริงก่อนกด generate (ไม่เสีย cost Gemini)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTemplate } from "@/content-creator/templates";
import { isContentCreatorEnabled } from "@/content-creator/lib/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  templateId: z.string().min(1),
  inputData: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  if (!isContentCreatorEnabled()) return new NextResponse(null, { status: 404 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  let template;
  try {
    template = getTemplate(body.templateId);
  } catch {
    return NextResponse.json({ ok: false, error: `unknown template: ${body.templateId}` }, { status: 400 });
  }
  const parsed = template.inputSchema.safeParse(body.inputData);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "input ไม่ตรง schema ของ template" }, { status: 400 });
  }

  // ใช้ parsed.data (canonical — strip/defaults/transforms) ให้ preview ตรงกับที่ create จะ gen [ตู๋ P2]
  return NextResponse.json({
    ok: true,
    captionPrompt: template.buildCaptionPrompt(parsed.data),
    imagePrompt: template.buildImagePrompt(parsed.data),
  });
}
