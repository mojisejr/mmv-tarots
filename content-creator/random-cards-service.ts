/**
 * random-cards draft service [PR#103] — ผูก draft lifecycle (db/drafts) เข้ากับ random-cards:
 *   draw ไพ่ 3 ใบ (deterministic per draft/attempt → persist) + Gemini ตีความ (quote+body).
 * reuse draftErrorStatus / classifyFinalizeStatus จาก daily7-service (generic helpers).
 */
import { z } from "zod";
import type { ContentDb } from "./db/client";
import { createDraft, completeDraftGen, failDraftGen, claimRegen, finalizeDraft, getDraft, DraftStaleError, type ContentDraft, type FinalizeResult } from "./db/drafts";
import { genObject } from "./lib/gemini";
import { drawCards, selectCardById } from "./lib/card-pool";
import { randomCardsSchema, RANDOM_CARDS_TEMPLATE_ID } from "./templates/random-cards";

export { RANDOM_CARDS_TEMPLATE_ID };

const N_CARDS = 3;
/** schema ที่ model ต้องคืน — ตีความรวม 3 ใบ (quote สั้น + body) */
const readingGenSchema = z.object({ quote: z.string(), body: z.string() });

// fit-by-design [D3]: คุม source ให้สั้น "จริง" — ไม่ใช่ปล่อยยาวแล้วตัด/clip ทีหลัง (ฟีม: ห้ามตัดทอน)
const READING_SYSTEM =
  'คุณคือ "แม่หมอ Mimi" (แมวหมอดูสายฟีลกู้ด). ตีความไพ่ทาโรต์ 3 ใบ "รวมเป็นสถานการณ์เดียว" โทนอบอุ่นให้กำลังใจ. ' +
  "**สั้น กระชับ**: quote = ประโยคเด่น 1 บรรทัด **ไม่เกิน 80 ตัวอักษร**, body = คำทำนาย **ไม่เกิน 220 ตัวอักษร** (2-3 ประโยคสั้น). " +
  "ห้ามเขียนยาว/ขยายความเกินกำหนด (ภาพมีพื้นที่จำกัด ยาวเกินจะถูกตัด). ห้ามใส่ชื่อไพ่ผิด.";

/** ตีความไพ่ 3 ใบ → {quote, body} (1 call) + validate length ; ไม่ผ่าน → regen 1 ครั้ง → throw [เหมือน genDaily7Days] */
async function genReading(cardIds: string[]): Promise<{ quote: string; body: string }> {
  const cardList = cardIds.map((id) => selectCardById(id)).map((c) => `${c.nameTh} (${c.nameEn})`).join(", ");
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const system = attempt === 0 ? READING_SYSTEM : `${READING_SYSTEM}\n\n(รอบก่อนไม่ผ่าน: ${lastErr} — ทำให้สั้นลงตามกติกา)`;
    const obj = await genObject({ schema: readingGenSchema, system, prompt: `ไพ่ที่จั่วได้ 3 ใบ (เรียงซ้าย→ขวา): ${cardList}\nตีความรวมเป็นสถานการณ์เดียว` });
    const quote = obj.quote.trim();
    const body = obj.body.trim();
    // validate ตาม randomCardsSchema (quote<=110, body<=260) — system ตั้งเป้าสั้นกว่า (~80/~220) ให้ fit โปร่ง
    const parsed = randomCardsSchema.safeParse({ cardIds, quote, body });
    if (parsed.success) return { quote, body };
    lastErr = parsed.error.issues.map((i) => i.message).join("; ");
  }
  throw new Error(`ตีความไพ่ไม่ผ่านกติกาหลัง regen: ${lastErr}`);
}

/** draw ไพ่ (seed → deterministic, persist) + ตีความ → เขียนกลับ draft (complete/fail ตาม token) */
async function runCardsGen(db: ContentDb, id: string, token: string, seed: string): Promise<void> {
  try {
    const cardIds = drawCards(seed, N_CARDS).map((c) => c.id);
    const { quote, body } = await genReading(cardIds);
    completeDraftGen(db, id, token, { cardIds, quote, body });
  } catch (e) {
    failDraftGen(db, id, token, e instanceof Error ? e.message : String(e));
  }
}

/** สร้าง draft + จั่ว 3 ใบ + ตีความ (sync). retry requestKey เดิม → ไพ่/ตีความเดิม (ไม่ gen ซ้ำ) */
export async function createRandomCardsDraft(db: ContentDb, requestKey: string): Promise<ContentDraft> {
  const { draft, token, fresh } = createDraft(db, { requestKey, templateId: RANDOM_CARDS_TEMPLATE_ID, seedPayload: {} });
  if (fresh && token) await runCardsGen(db, draft.id, token, draft.id); // seed = draft.id (deterministic per draft)
  return getDraft(db, draft.id)!;
}

/** สุ่มใหม่ทั้งชุด (จงใจ) — attemptKey ใหม่ = seed ใหม่ → ไพ่ชุดใหม่ + ตีความใหม่. replay (key เดิม) → ไม่ gen ซ้ำ */
export async function regenRandomCardsDraft(db: ContentDb, id: string, attemptKey: string, expectedRevision: number): Promise<ContentDraft> {
  const { draft, token, replay } = claimRegen(db, id, attemptKey, expectedRevision);
  if (replay || !token) return draft;
  await runCardsGen(db, id, token, attemptKey); // seed = attemptKey → ไพ่ชุดใหม่
  return getDraft(db, id)!;
}

/** finalize → สร้าง contentPost (persist cardIds+quote+body). ไม่มี backgroundId (hybrid ใช้ AI scene) */
export function finalizeRandomCardsDraft(db: ContentDb, id: string, finalizeKey: string, expectedRevision: number): FinalizeResult {
  const draft = getDraft(db, id);
  if (!draft) throw new DraftStaleError(`ไม่พบ draft: ${id}`);
  const finalInput = randomCardsSchema.parse(draft.draftData ?? {}); // strict: 3 ใบ unique + quote/body
  return finalizeDraft(db, id, finalizeKey, expectedRevision, finalInput, RANDOM_CARDS_TEMPLATE_ID);
}
