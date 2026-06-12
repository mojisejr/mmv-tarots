/**
 * content-creator/lib/gemini.ts — gen caption + image ผ่าน Gemini (Gate A)
 *
 * Gate A (จาก ตู๋ review PR#84):
 *  - genImage คืน Uint8Array ให้ caller จัดการ persist เอง (ไม่ writeFileSync ในนี้)
 *  - temperature เป็น param (คุม tone)
 *  - model จาก env แยก (CONTENT_TEXT_MODEL / CONTENT_IMAGE_MODEL) ไม่ reuse MODEL_NAME
 *
 * พิสูจน์ feasibility แล้วใน POC #1 (gemini-2.5-flash + imagen-4.0-generate-001)
 */
import { google } from "@ai-sdk/google";
import { generateText, experimental_generateImage as generateImage } from "ai";
import { TEXT_MODEL, IMAGE_MODEL, DEFAULT_CAPTION_TEMPERATURE } from "./config";

export interface CaptionInput {
  /** system prompt — กำหนด persona/รูปแบบ (เช่น tone หมอมี่) */
  system: string;
  /** user prompt — ข้อมูล content ที่จะเขียนถึง */
  prompt: string;
  /** คุม tone; default DEFAULT_CAPTION_TEMPERATURE */
  temperature?: number;
}

/** gen caption → ข้อความ */
export async function genCaption(input: CaptionInput): Promise<string> {
  const { text } = await generateText({
    model: google(TEXT_MODEL),
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature ?? DEFAULT_CAPTION_TEMPERATURE,
  });
  return text;
}

export interface ImageInput {
  prompt: string;
  /** สัดส่วนภาพ; default "1:1" (เหมาะ FB square) */
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}

/** gen ภาพ → Uint8Array (caller จัดการ persist/upload เอง — Gate A) */
export async function genImage(input: ImageInput): Promise<Uint8Array> {
  const { image } = await generateImage({
    model: google.image(IMAGE_MODEL),
    prompt: input.prompt,
    aspectRatio: input.aspectRatio ?? "1:1",
  });
  return image.uint8Array;
}
