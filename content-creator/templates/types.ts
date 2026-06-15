/**
 * content-creator Template Registry — engine เดียว, หลาย template
 * เพิ่ม "แบบ" ใหม่ = เพิ่มไฟล์ template + ลงทะเบียนใน index.ts (ไม่แตะ engine) [open/closed]
 */
import type { z } from "zod";
import type { BrandProfile } from "../db/schema";

export interface CaptionPrompt {
  system: string;
  prompt: string;
}

/** context (minimal explicit) ที่ engine ส่งให้ renderImage — ขยายเมื่อ template ต้องใช้จริง [S6a] */
export interface RenderContext {
  brand: BrandProfile;
}

/**
 * imageStrategy:
 *  - "ai": gen ภาพด้วย Gemini (buildImagePrompt) — ใช้ brand ref/nano banana [finance]
 *  - "composition": template render ภาพเอง (renderImage) — **ไม่แตะ Gemini image / brand ref** [daily-7]
 */
export type ImageStrategy = "ai" | "composition";

export interface ContentTemplate {
  /** templateId — ผูกกับ ContentPost.templateId */
  id: string;
  /** ชื่อให้คนอ่าน (UI) */
  name: string;
  /** schema ของ inputData ที่ template นี้ต้องการ (validate ก่อน gen) */
  inputSchema: z.ZodTypeAny;
  /** สร้าง prompt สำหรับ caption (gemini genCaption) จาก input */
  buildCaptionPrompt(data: unknown): CaptionPrompt;
  /** วิธีสร้างภาพ — engine เลือก path ตามนี้ */
  imageStrategy: ImageStrategy;
  /** [ai] สร้าง prompt สำหรับภาพ (Gemini gen) */
  buildImagePrompt?(data: unknown): string;
  /** [composition] render ภาพเอง → Uint8Array (parsed canonical + ctx ; ไม่เรียก Gemini/brand ref) */
  renderImage?(data: unknown, ctx: RenderContext): Promise<Uint8Array>;
}
