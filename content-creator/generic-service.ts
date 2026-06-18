/**
 * generic content draft service [Phase C] — ผูก draft lifecycle (db/drafts) เข้ากับ generic resolver.
 * โครงเดียวกับ daily7-service: service = draft fence (createDraft → resolve → complete/fail → finalize),
 * route = generate + classify. paid genObject อยู่หลัง createDraft fresh=true **เท่านั้น** [too P1.1].
 *
 * idempotency: requestKey เดิม + type(canonical) ตรง → คืน draft เดิม (ไม่ gen ซ้ำ) ; ต่าง → 409.
 */
import { ZodError } from "zod";
import type { ContentDb } from "./db/client";
import {
  createDraft,
  completeDraftGen,
  failDraftGen,
  finalizeDraft,
  getDraft,
  DraftStaleError,
  DraftConflictError,
  type ContentDraft,
  type FinalizeResult,
} from "./db/drafts";
import { resolveTypeToContent, canonicalizeType } from "./agent/resolve";
import { genericContentSchema, GENERIC_TEMPLATE_ID } from "./templates/generic";
import type { ContentStatus } from "./db/schema";

/** GENERATING lease ที่ค้างนานเกินนี้ = process น่าจะตายหลัง createDraft ก่อน complete/fail → ให้ client เริ่มใหม่ [too P2] */
export const STALE_GENERATING_MS = 2 * 60 * 1000;

/** type ว่างหลัง canonicalize → invalid (route → 400) */
export class InvalidTypeError extends Error {}

/**
 * classify status ของ contentPost (หลัง generate) → http/ok/definitive [§1.1].
 * FINALIZED → ต้องอ่าน contentPost.status จริง ไม่เหมา success [too round-2].
 */
export function classifyGenericStatus(status: ContentStatus): { http: number; ok: boolean; definitive: boolean } {
  if (status === "GENERATED" || status === "APPROVED" || status === "PUBLISHING" || status === "POSTED") {
    return { http: 200, ok: true, definitive: true };
  }
  if (status === "GENERATING" || status === "PENDING") return { http: 202, ok: false, definitive: false };
  return { http: 502, ok: false, definitive: true }; // FAILED / CANCELED
}

/** map error ของ draft lifecycle → HTTP status (route ใช้) */
export function genericDraftErrorStatus(e: unknown): { status: number; error: string } {
  if (e instanceof InvalidTypeError) return { status: 400, error: e.message };
  if (e instanceof DraftConflictError) return { status: 409, error: e.message };
  if (e instanceof DraftStaleError) return { status: 409, error: e.message };
  if (e instanceof ZodError) return { status: 400, error: "generic content ไม่ผ่าน schema" };
  return { status: 500, error: e instanceof Error ? e.message : String(e) };
}

/** GENERATING ที่ lease หมดอายุ (process ตายกลางคัน) — client ควรเริ่มใหม่ด้วย key ใหม่ */
export function isStaleGenerating(draft: ContentDraft): boolean {
  return (
    draft.status === "GENERATING" &&
    !!draft.generatingAt &&
    Date.now() - draft.generatingAt.getTime() > STALE_GENERATING_MS
  );
}

/** lowConf advisory ที่ฝังใน draftData.meta (persist → คิว approve โชว์ได้หลัง navigation) [too P2] */
export function draftLowConf(draft: ContentDraft): boolean {
  const meta = (draft.draftData as { meta?: { lowConf?: boolean } } | null)?.meta;
  return meta?.lowConf === true;
}

/** resolve → complete/fail ตาม token. completeDraftGen=false (superseded) → ไม่ทำต่อ (caller re-read DB) [too P2] */
async function runGen(db: ContentDb, id: string, token: string, canonicalType: string): Promise<void> {
  try {
    const content = await resolveTypeToContent(canonicalType);
    completeDraftGen(db, id, token, content as unknown as Record<string, unknown>);
  } catch (e) {
    failDraftGen(db, id, token, e instanceof Error ? e.message : String(e));
  }
}

/**
 * สร้าง draft + resolve content (sync). retry requestKey เดิม → ไม่ gen ซ้ำ (idempotent).
 * @throws InvalidTypeError ถ้า type ว่าง ; DraftConflictError ถ้า requestKey ซ้ำแต่ type ต่าง
 */
export async function createGenericDraft(db: ContentDb, requestKey: string, rawType: string): Promise<ContentDraft> {
  const type = canonicalizeType(rawType);
  if (!type) throw new InvalidTypeError("type ว่าง (หลัง trim)");
  // seedPayload = { type } canonical → same-key payload equality เสถียร (whitespace/case ไม่ทำ 409 หลอก) [too P2]
  const { draft, token, fresh } = createDraft(db, { requestKey, templateId: GENERIC_TEMPLATE_ID, seedPayload: { type } });
  if (fresh && token) await runGen(db, draft.id, token, type); // paid genObject หลัง fresh+token เท่านั้น
  return getDraft(db, draft.id)!;
}

/**
 * finalize → snapshot GenericContent → สร้าง contentPost (PENDING). strict parse ก่อน snapshot
 * (ไม่ finalize stale/invalid local content). idempotent ผ่าน finalizeKey replay + contentPostId guard.
 * @throws DraftStaleError ถ้า revision ไม่ตรง/ไม่ใช่ READY ; ZodError ถ้า draftData ไม่ผ่าน
 */
export function finalizeGenericDraft(db: ContentDb, id: string, finalizeKey: string, expectedRevision: number): FinalizeResult {
  const draft = getDraft(db, id);
  if (!draft) throw new DraftStaleError(`ไม่พบ draft: ${id}`);
  const finalInput = genericContentSchema.parse(draft.draftData ?? {}); // strict (กัน finalize ของเสีย)
  return finalizeDraft(db, id, finalizeKey, expectedRevision, finalInput as Record<string, unknown>, GENERIC_TEMPLATE_ID);
}
