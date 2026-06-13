/**
 * content-creator Template Registry — engine เดียว, หลาย template
 * เพิ่ม "แบบ" ใหม่ = เพิ่มไฟล์ template + ลงทะเบียนใน index.ts (ไม่แตะ engine) [open/closed]
 */
import type { z } from "zod";

export interface CaptionPrompt {
  system: string;
  prompt: string;
}

export interface ContentTemplate {
  /** templateId — ผูกกับ ContentPost.templateId */
  id: string;
  /** ชื่อให้คนอ่าน (UI) */
  name: string;
  /** schema ของ inputData ที่ template นี้ต้องการ (validate ก่อน gen) */
  inputSchema: z.ZodTypeAny;
  /** สร้าง prompt สำหรับ caption (gemini genCaption) จาก input */
  buildCaptionPrompt(data: unknown): CaptionPrompt;
  /** สร้าง prompt สำหรับภาพ (gemini genImage) จาก input */
  buildImagePrompt(data: unknown): string;
}
