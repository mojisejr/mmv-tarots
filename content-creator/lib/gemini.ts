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
import { generateText, generateObject, experimental_generateImage as generateImage } from "ai";
import type { z } from "zod";
import { TEXT_MODEL, IMAGE_MODEL, REF_IMAGE_MODEL, DEFAULT_CAPTION_TEMPERATURE } from "./config";

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

/**
 * gen แบบ structured output (JSON ตรง schema) — ใช้กับ daily-7 gen 7 วันทั้งชุดในครั้งเดียว [S6c].
 * model คืน object ที่ผ่าน schema (ai SDK retry/repair ให้ระดับนึง) ; caller validate ซ้ำอีกชั้น.
 */
export async function genObject<T>(input: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<T> {
  const { object } = await generateObject({
    model: google(TEXT_MODEL),
    schema: input.schema,
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature ?? DEFAULT_CAPTION_TEMPERATURE,
  });
  return object;
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

export interface ImageWithRefInput {
  prompt: string;
  /** ภาพ reference (ตัวละคร/style ที่ fix) — model ยึดตามนี้ */
  refImage: Uint8Array;
  /** model override (default REF_IMAGE_MODEL = nano banana) */
  model?: string;
  /** aspect ratio เช่น "1:1" — **optional** (ไม่ส่ง = behavior เดิม) backward-compat caller อื่น [PR#105 ก้อน2] */
  aspectRatio?: string;
}

/**
 * gen ภาพโดยยึด reference image (character/style consistency) [S3.5c] — verified by spike.
 * ใช้ gemini-2.5-flash-image (nano banana): เป็น multimodal LM → generateText (ไม่ใช่ generateImage),
 * ส่ง ref ใน messages + responseModalities IMAGE, image output ที่ result.files[].uint8Array.
 * @throws ถ้า model ไม่คืน image
 */
/**
 * providerOptions.google สำหรับ ref-image gen [PR#105] — pure/testable.
 * aspectRatio: ใส่ imageConfig เฉพาะเมื่อระบุ (ไม่ระบุ = ไม่มี imageConfig = behavior เดิม → backward-compat)
 */
export function buildImageProviderOptions(aspectRatio?: string) {
  return {
    google: {
      responseModalities: ["TEXT", "IMAGE"],
      ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
    },
  };
}

export async function genImageWithRef(input: ImageWithRefInput): Promise<Uint8Array> {
  const result = await generateText({
    model: google(input.model ?? REF_IMAGE_MODEL),
    providerOptions: buildImageProviderOptions(input.aspectRatio),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: input.prompt },
          { type: "image", image: input.refImage },
        ],
      },
    ],
  });
  const img = (result.files ?? []).find((f) => f.mediaType?.startsWith("image/"));
  if (!img) {
    throw new Error(`ref-image model ไม่คืนภาพ (text=${result.text?.slice(0, 100) ?? ""})`);
  }
  return img.uint8Array;
}
