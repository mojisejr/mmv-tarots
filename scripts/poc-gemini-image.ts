/**
 * POC #1 — content-creator: พิสูจน์ว่า Gemini gen "caption + ภาพ" ได้จริง
 *
 * lab-first: ยังไม่มี DB/UI/Facebook — แค่ mock input ไพ่ 1 ใบ → Gemini → ไฟล์ภาพ + caption
 *
 * รัน:  node --env-file=.env.local --import tsx scripts/poc-gemini-image.ts
 * ต้องมี GOOGLE_GENERATIVE_AI_API_KEY ใน .env.local
 */
import { google } from "@ai-sdk/google";
import { generateText, experimental_generateImage as generateImage } from "ai";
import { writeFileSync } from "node:fs";

// ── mock input (เลียนแบบ 1 แถวใน content sheet ของฟีม) ──
const MOCK = {
  card: "8 of Wands",
  meaning:
    "เปิดสัปดาห์ด้วยไพ่ 8 ไม้เท้า การเงินลื่นไหลปรี๊ดปร๊าด เงินเข้าเยอะตามปริมาณงาน รับออเดอร์รัวๆ",
};

const TEXT_MODEL = process.env.MODEL_NAME || "gemini-2.5-flash";
const IMAGE_MODEL = process.env.IMAGE_MODEL_NAME || "imagen-4.0-generate-001";

async function main() {
  console.log(`🔮 POC #1 — text=${TEXT_MODEL}  image=${IMAGE_MODEL}\n`);

  // 1) CAPTION — reuse pattern เดียวกับ lib/server/ai/agents (generateText + google())
  const { text: caption } = await generateText({
    model: google(TEXT_MODEL),
    system:
      'คุณคือ "หมอมี่" หมอดูไพ่ยิปซีสายฟีลกู้ด พูดน่ารักเป็นกันเอง ใช้คำว่า พี่หมี่, ฟีลลิ่ง, ซัพพอร์ต, ปังมาก, แม่. เขียนแคปชั่นดวงการเงินลง Facebook สั้น กระชับ 2-3 ประโยค จบด้วย hashtag #ดูดวงการเงิน #หมอมี่',
    prompt: `ไพ่: ${MOCK.card}\nความหมายวันนี้: ${MOCK.meaning}\nเขียนแคปชั่น:`,
  });
  console.log("── CAPTION ──\n" + caption + "\n");

  // 2) IMAGE — Gemini/Imagen ผ่าน AI SDK
  const imagePrompt = `สร้างภาพสไตล์ไพ่ยิปซีใบ ${MOCK.card} (8 ไม้เท้า) ตีความแบบโมเดิร์น สื่อถึงการเงินลื่นไหล งานเข้ารัวๆ พลังบวก คุมโทนสีอบอุ่นดูมงคล สวยงามเหมาะลงโซเชียล`;
  const { image } = await generateImage({
    model: google.image(IMAGE_MODEL),
    prompt: imagePrompt,
    aspectRatio: "1:1",
  });
  const out = "scripts/poc-output.png";
  writeFileSync(out, image.uint8Array);
  console.log(`── IMAGE ──\nsaved → ${out} (${image.uint8Array.length} bytes)`);
  console.log("\n✅ POC #1 ผ่าน — Gemini gen caption + ภาพ ได้จริง");
}

main().catch((err) => {
  console.error("\n❌ POC #1 ล้มเหลว:");
  console.error(err?.message || err);
  process.exit(1);
});
