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
  /**
   * persisted stable seed (= post id) สำหรับเลือก asset แบบ deterministic [S6b].
   * id เดิม → ผลเดิมทุกครั้ง (retry/reclaim/preview ตรงกัน) — ห้ามใช้ Math.random ใน render
   */
  seed: string;
}

/**
 * imageStrategy:
 *  - "ai": gen ภาพด้วย Gemini (buildImagePrompt) — ใช้ brand ref/nano banana [finance]
 *  - "composition": template render ภาพเอง (renderImage) — **ไม่แตะ Gemini image / brand ref** [daily-7]
 *  - "hybrid": AI scene (buildImagePrompt, no text) → composition overlay (renderComposite วางไพ่+ข้อความ) [random-cards]
 */
export type ImageStrategy = "ai" | "composition" | "hybrid";

interface BaseTemplate {
  /** templateId — ผูกกับ ContentPost.templateId */
  id: string;
  /** ชื่อให้คนอ่าน (UI) */
  name: string;
  /** schema ของ inputData ที่ template นี้ต้องการ (validate ก่อน gen) */
  inputSchema: z.ZodTypeAny;
  /** สร้าง prompt สำหรับ caption (gemini genCaption) จาก input */
  buildCaptionPrompt(data: unknown): CaptionPrompt;
}

/** template ที่ gen ภาพด้วย Gemini — buildImagePrompt บังคับ */
export interface AiTemplate extends BaseTemplate {
  imageStrategy: "ai";
  buildImagePrompt(data: unknown): string;
}

/** template ที่ render ภาพเอง (composition) — renderImage บังคับ ; ไม่เรียก Gemini/brand ref */
export interface CompositionTemplate extends BaseTemplate {
  imageStrategy: "composition";
  renderImage(data: unknown, ctx: RenderContext): Promise<Uint8Array>;
}

/**
 * template ที่ผสม AI + composition [random-cards] — buildImagePrompt (AI scene, no text) + renderComposite บังคับ.
 * pipeline (engine): caption → AI scene (ref แมว, no text) → renderComposite(scene) วางไพ่จริง+ข้อความไทยทับ.
 */
export interface HybridTemplate extends BaseTemplate {
  imageStrategy: "hybrid";
  /** prompt ฉาก AI (ไม่มีข้อความ/ไพ่ — ไพ่+ข้อความมาจาก composition เท่านั้น) [ตู๋ P1] */
  buildImagePrompt(data: unknown): string;
  /** วาง composition (ไพ่จริง + ข้อความไทย) ทับ AI scene ที่ gen มาแล้ว → ภาพ final */
  renderComposite(data: unknown, ctx: RenderContext, scene: Uint8Array): Promise<Uint8Array>;
}

/**
 * discriminated union — แต่ละ strategy บังคับ method ของตัวเอง [ตู๋ P1]:
 *   ai → buildImagePrompt ; composition → renderImage ; hybrid → buildImagePrompt + renderComposite
 * (เลิก optional → ไม่มี impossible combo หลุดถึง runtime + engine narrow ได้ ไม่ต้อง guard/?.)
 */
export type ContentTemplate = AiTemplate | CompositionTemplate | HybridTemplate;
