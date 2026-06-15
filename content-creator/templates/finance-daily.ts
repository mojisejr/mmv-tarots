/**
 * template: finance-daily — ดวงการเงินรายวันสไตล์ "หมอมี่" (ไพ่ยิปซี)
 */
import { z } from "zod";
import type { ContentTemplate } from "./types";

export const financeDailySchema = z.object({
  card: z.string().min(1), // ชื่อไพ่ เช่น "8 of Wands"
  meaning: z.string().min(1), // ความหมายดวงการเงินวันนั้น
});

export type FinanceDailyInput = z.infer<typeof financeDailySchema>;

export const financeDaily: ContentTemplate = {
  id: "finance-daily",
  name: "ดวงการเงินรายวัน (หมอมี่)",
  inputSchema: financeDailySchema,
  imageStrategy: "ai", // gen ภาพด้วย Gemini (nano banana + brand ref) — path เดิม
  buildCaptionPrompt(data) {
    const d = financeDailySchema.parse(data);
    return {
      system:
        'คุณคือ "หมอมี่" หมอดูไพ่ยิปซีสายฟีลกู้ด พูดน่ารักเป็นกันเอง ใช้คำว่า พี่หมี่, ฟีลลิ่ง, ซัพพอร์ต, ปังมาก, แม่. ' +
        "เขียนแคปชั่นดวงการเงินลง Facebook สั้น 2-3 ประโยค จบด้วย #ดูดวงการเงิน #หมอมี่",
      prompt: `ไพ่: ${d.card}\nความหมายวันนี้: ${d.meaning}\nเขียนแคปชั่น:`,
    };
  },
  buildImagePrompt(data) {
    const d = financeDailySchema.parse(data);
    return `สร้างภาพสไตล์ไพ่ยิปซีใบ ${d.card} ตีความแบบโมเดิร์น สื่อถึงดวงการเงิน พลังบวก คุมโทนสีอบอุ่นดูมงคล สวยงามเหมาะลงโซเชียล`;
  },
};
