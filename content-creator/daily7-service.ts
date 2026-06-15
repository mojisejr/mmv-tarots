/**
 * daily-7 draft service [S6c] — ผูก draft lifecycle (db/drafts) เข้ากับ daily-7 gen/validate.
 * route handler บาง: เรียก service เหล่านี้ (gen sync ใน request — admin tool, ฟีมรอไม่กี่วิ)
 */
import { ZodError } from "zod";
import type { ContentDb } from "./db/client";
import {
  createDraft,
  completeDraftGen,
  failDraftGen,
  editDraft,
  claimRegen,
  finalizeDraft,
  getDraft,
  DraftStaleError,
  DraftConflictError,
  type ContentDraft,
  type FinalizeResult,
} from "./db/drafts";
import { genDaily7Days, daily7Schema, canonicalizeDays } from "./templates/daily7";
import { assertValidBackgroundId } from "./lib/bg-pool";

export const DAILY7_TEMPLATE_ID = "daily-7";

/** map error ของ draft lifecycle → HTTP status (route ใช้ร่วม) */
export function draftErrorStatus(e: unknown): { status: number; error: string } {
  if (e instanceof DraftConflictError) return { status: 409, error: e.message };
  if (e instanceof DraftStaleError) return { status: 409, error: e.message };
  if (e instanceof ZodError) return { status: 400, error: "draftData ไม่ผ่าน schema (ครบ 7 วัน/ไม่ซ้ำ?)" };
  return { status: 500, error: e instanceof Error ? e.message : String(e) };
}

/** gen ผลกลับเข้า draft (complete/fail ตาม token) — ใช้ร่วม create+regen */
async function runGen(db: ContentDb, id: string, token: string, targetDate: string): Promise<void> {
  try {
    const days = await genDaily7Days(targetDate);
    completeDraftGen(db, id, token, { targetDate, days });
  } catch (e) {
    failDraftGen(db, id, token, e instanceof Error ? e.message : String(e));
  }
}

/** สร้าง draft + gen 7 วัน (sync). retry idempotent (requestKey เดิม → ไม่ gen ซ้ำ) */
export async function createDaily7Draft(db: ContentDb, requestKey: string, targetDate: string): Promise<ContentDraft> {
  const { draft, token, fresh } = createDraft(db, { requestKey, templateId: DAILY7_TEMPLATE_ID, seedPayload: { targetDate } });
  if (fresh && token) await runGen(db, draft.id, token, targetDate);
  return getDraft(db, draft.id)!;
}

/** regen ทั้งชุด (จงใจ) — attemptKey ใหม่ + expectedRevision. replay (key เดิม) → ไม่ gen ซ้ำ */
export async function regenDaily7Draft(db: ContentDb, id: string, attemptKey: string, expectedRevision: number): Promise<ContentDraft> {
  const { draft, token, replay } = claimRegen(db, id, attemptKey, expectedRevision);
  if (replay || !token) return draft;
  const targetDate = String((draft.seedPayload as { targetDate?: string }).targetDate ?? "");
  await runGen(db, id, token, targetDate);
  return getDraft(db, id)!;
}

/** edit คำทำนาย — draft = workspace (ยอมว่าง/ไม่ครบชั่วคราว ก็เก็บได้) ; strict ตอน finalize.
 *  เก็บ days ที่ส่งมาตามรูป (validate แค่ shape หลวม ๆ ที่ caller ทำ) คู่กับ targetDate เดิม */
export function editDaily7Draft(db: ContentDb, id: string, expectedRevision: number, days: { day: string; fortune: string }[]): ContentDraft {
  const draft = getDraft(db, id);
  if (!draft) throw new DraftStaleError(`ไม่พบ draft: ${id}`);
  const targetDate = String((draft.seedPayload as { targetDate?: string }).targetDate ?? "");
  return editDraft(db, id, expectedRevision, { targetDate, days });
}

/**
 * finalize → สร้าง contentPost. validate FinalInput strict (7 วัน canonical) + backgroundId อยู่ใน manifest.
 * @throws DraftStaleError ถ้าไม่พบ ; ZodError ถ้า draftData ไม่ผ่าน strict ; Error ถ้า backgroundId ไม่ valid
 */
export function finalizeDaily7Draft(db: ContentDb, id: string, finalizeKey: string, expectedRevision: number, backgroundId: string): FinalizeResult {
  const draft = getDraft(db, id);
  if (!draft) throw new DraftStaleError(`ไม่พบ draft: ${id}`);
  assertValidBackgroundId(backgroundId); // id ต้องอยู่ใน manifest (ไม่งั้น render พัง ตอน gen)
  // strict: draftData (targetDate+days) + backgroundId → FinalInput canonical (ครบ 7/ไม่ซ้ำ)
  const finalInput = daily7Schema.parse({ ...(draft.draftData ?? {}), backgroundId });
  // re-canonicalize days ให้เรียง + trim ก่อน persist (กัน order/whitespace หลุดจาก edit)
  const canonical = canonicalizeDays(finalInput.days);
  return finalizeDraft(db, id, finalizeKey, expectedRevision, { ...finalInput, days: canonical }, DAILY7_TEMPLATE_ID);
}
