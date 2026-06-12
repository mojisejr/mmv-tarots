/**
 * POC #2 — content-creator: พิสูจน์ post ภาพ+caption ขึ้น FB page ผ่าน Graph API
 *
 * lab-first end-to-end: gen ภาพ+caption (Gemini, จาก POC #1) → upload ขึ้นเพจแบบ UNPUBLISHED
 * (published=false) — ไม่ขึ้น feed สาธารณะ เพราะเพจ MimiVibe เป็น production
 *
 * รัน: node --env-file=.env.local --import tsx scripts/poc-fb-post.ts
 * ต้องมี: GOOGLE_GENERATIVE_AI_API_KEY, CONTENT_FB_PAGE_ID, CONTENT_FB_PAGE_ACCESS_TOKEN
 */
import { google } from "@ai-sdk/google";
import { generateText, experimental_generateImage as generateImage } from "ai";

const V = "v23.0";
const PAGE_ID = process.env.CONTENT_FB_PAGE_ID!;
const PAGE_TOKEN = process.env.CONTENT_FB_PAGE_ACCESS_TOKEN!;
const TEXT_MODEL = process.env.MODEL_NAME || "gemini-2.5-flash";
const IMAGE_MODEL = process.env.IMAGE_MODEL_NAME || "imagen-4.0-generate-001";

const MOCK = {
  card: "Ace of Coins",
  meaning: "วันศุกร์ได้ไพ่ 1 เหรียญ โอกาสจับเงินก้อนใหญ่ มีโชคลาภ รายได้ช่องทางใหม่",
};

async function main() {
  console.log("🔮 POC #2 — gen → post (UNPUBLISHED) ขึ้นเพจ MimiVibe\n");

  // 1) caption + image (reuse POC #1)
  const { text: caption } = await generateText({
    model: google(TEXT_MODEL),
    temperature: 0.8, // ตู๋ nit (b): คุม tone caption
    system:
      'คุณคือ "หมอมี่" หมอดูไพ่ยิปซีสายฟีลกู้ด ใช้คำ พี่หมี่/ปังมาก/แม่. แคปชั่นดวงการเงิน Facebook สั้น 2-3 ประโยค จบด้วย #ดูดวงการเงิน #หมอมี่',
    prompt: `ไพ่: ${MOCK.card}\nความหมาย: ${MOCK.meaning}\nเขียนแคปชั่น:`,
  });
  console.log("── CAPTION ──\n" + caption + "\n");

  const { image } = await generateImage({
    model: google.image(IMAGE_MODEL),
    prompt: `ภาพไพ่ยิปซี ${MOCK.card} สไตล์โมเดิร์น สื่อโชคลาภการเงิน เงินก้อนใหญ่ โทนทองอบอุ่นมงคล`,
    aspectRatio: "1:1",
  });
  console.log(`── IMAGE ── gen แล้ว (${image.uint8Array.length} bytes)\n`);

  // 2) upload ขึ้นเพจ — published=false (unpublished, ไม่ขึ้น feed สาธารณะ)
  const form = new FormData();
  form.append("message", caption);
  form.append("published", "false");
  form.append("access_token", PAGE_TOKEN);
  form.append("source", new Blob([image.uint8Array], { type: "image/png" }), "tarot.png");

  const res = await fetch(`https://graph.facebook.com/${V}/${PAGE_ID}/photos`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (data.error) throw new Error(`FB post fail: ${data.error.message} (code ${data.error.code})`);

  console.log("── FB RESULT ──");
  console.log(`✅ โพสต์ unpublished สำเร็จ — photo id: ${data.id}${data.post_id ? `, post_id: ${data.post_id}` : ""}`);

  // 3) verify รูปอยู่จริงบนเพจ (ยัง unpublished)
  const chk = await fetch(`https://graph.facebook.com/${V}/${data.id}?fields=id,created_time,published&access_token=${PAGE_TOKEN}`).then((r) => r.json());
  console.log(`── VERIFY ── id=${chk.id} created=${chk.created_time} published=${chk.published}`);
  console.log("\n✅ POC #2 ผ่าน — gen → post ขึ้นเพจได้จริง (unpublished, ปลอดภัยกับเพจ production)");
  console.log(`💡 ลบรูปเทสต์: DELETE /${data.id} (หรือลบใน Meta Business Suite > Content)`);
}

main().catch((err) => {
  console.error("\n❌ POC #2 ล้มเหลว:", err?.message || err);
  process.exit(1);
});
