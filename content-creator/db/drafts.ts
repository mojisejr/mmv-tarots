/**
 * content-creator draft lifecycle [S6c] — generic ต่อ template (daily-7 ใช้ก่อน)
 *
 * concurrency model (ตู๋ P1.A/D):
 *  - requestKey (unique) = idempotency ของ "สร้าง draft 1 ครั้ง" : retry เน็ตหลุด → คืน draft เดิม
 *    (same key + payload ต่าง → 409)
 *  - revision = optimistic lock : edit/regen/finalize ต้อง WHERE revision=expected → bump ทุกครั้ง
 *  - generationToken = ownership ของ gen/regen attempt : เขียนผลกลับเฉพาะ token+state ยังตรง
 *    (กัน stale regen ทับ user edits / attempt ใหม่)
 *  - attemptKey = idempotency ของ regen (จงใจ gen ใหม่) : replay → ไม่ gen ซ้ำ
 *  - finalizeKey + contentPostId NULL guard + contentPosts.requestKey unique = กัน double-finalize
 */
import { and, eq, sql } from "drizzle-orm";
import type { ContentDb } from "./client";
import { contentDrafts, contentPosts, type ContentDraft } from "./schema";
import { isDaily7ActiveFenceViolation } from "./transition";

export type { ContentDraft } from "./schema";

/** GENERATING lease หมดอายุ → regen ยึดต่อได้ (กัน stuck จาก lost-response ที่ gen ตายกลางคัน) */
const STALE_LEASE_MS = 2 * 60 * 1000;

/** requestKey ซ้ำแต่ payload ต่าง / regen-finalize ชน state → 409 */
export class DraftConflictError extends Error {}
/** revision ไม่ตรง หรือ state ไม่อนุญาต (stale / finalized) */
export class DraftStaleError extends Error {}

/** stable stringify (sort keys) — เทียบ seedPayload equality ไม่ให้ลำดับ key หลอก */
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
}

export function getDraft(db: ContentDb, id: string): ContentDraft | undefined {
  return db.select().from(contentDrafts).where(eq(contentDrafts.id, id)).get();
}

export interface CreateDraftArgs {
  requestKey: string;
  templateId: string;
  /** canonical seed (frozen identity เช่น { targetDate }) */
  seedPayload: Record<string, unknown>;
}
export interface CreateDraftResult {
  draft: ContentDraft;
  /** token สำหรับ gen ครั้งแรก (มีเฉพาะ fresh=true) — fresh=false คือ retry idempotent */
  token: string | null;
  fresh: boolean;
}

/**
 * สร้าง draft (หรือคืนของเดิมแบบ idempotent ถ้า requestKey ซ้ำ + payload ตรง).
 * fresh=true → caller ต้อง gen แล้ว complete/fail ด้วย token. fresh=false → gen ไปแล้ว/กำลังทำ (อย่า gen ซ้ำ).
 * @throws DraftConflictError ถ้า requestKey ซ้ำแต่ payload/template ต่าง
 */
export function createDraft(db: ContentDb, args: CreateDraftArgs): CreateDraftResult {
  const idempotentReturn = (): CreateDraftResult | null => {
    const ex = db.select().from(contentDrafts).where(eq(contentDrafts.requestKey, args.requestKey)).get();
    if (!ex) return null;
    if (ex.templateId !== args.templateId || stableStringify(ex.seedPayload) !== stableStringify(args.seedPayload)) {
      throw new DraftConflictError(`requestKey ซ้ำแต่ payload/template ต่าง: ${args.requestKey}`);
    }
    return { draft: ex, token: null, fresh: false };
  };

  const pre = idempotentReturn();
  if (pre) return pre;

  const token = crypto.randomUUID();
  const id = crypto.randomUUID();
  try {
    db.insert(contentDrafts)
      .values({ id, requestKey: args.requestKey, templateId: args.templateId, seedPayload: args.seedPayload, status: "GENERATING", revision: 0, generationToken: token, generatingAt: new Date() })
      .run();
  } catch {
    // race: request อื่น insert requestKey เดียวกันก่อน (unique) → คืน idempotent
    const post = idempotentReturn();
    if (post) return post;
    throw new Error(`createDraft insert ล้มเหลว: ${args.requestKey}`);
  }
  return { draft: getDraft(db, id)!, token, fresh: true };
}

/** gen สำเร็จ: GENERATING+token → READY (เก็บ draftData) เฉพาะ token ตรง. false = superseded */
export function completeDraftGen(db: ContentDb, id: string, token: string, draftData: Record<string, unknown>): boolean {
  const res = db
    .update(contentDrafts)
    .set({ status: "READY", draftData, generationToken: null, generatingAt: null, error: null, revision: sql`${contentDrafts.revision} + 1`, updatedAt: new Date() })
    .where(and(eq(contentDrafts.id, id), eq(contentDrafts.status, "GENERATING"), eq(contentDrafts.generationToken, token)))
    .run();
  return res.changes === 1;
}

/** gen ล้ม: GENERATING+token → FAILED เฉพาะ token ตรง. false = superseded */
export function failDraftGen(db: ContentDb, id: string, token: string, error: string): boolean {
  const res = db
    .update(contentDrafts)
    .set({ status: "FAILED", error, generationToken: null, generatingAt: null, revision: sql`${contentDrafts.revision} + 1`, updatedAt: new Date() })
    .where(and(eq(contentDrafts.id, id), eq(contentDrafts.status, "GENERATING"), eq(contentDrafts.generationToken, token)))
    .run();
  return res.changes === 1;
}

/**
 * edit draftData (ฟีมแก้คำทำนาย) — optimistic: READY + revision=expected → bump.
 * @throws DraftStaleError ถ้า revision ไม่ตรง/ไม่ใช่ READY (stale/finalized/กำลัง gen)
 */
export function editDraft(db: ContentDb, id: string, expectedRevision: number, draftData: Record<string, unknown>): ContentDraft {
  const res = db
    .update(contentDrafts)
    .set({ draftData, revision: sql`${contentDrafts.revision} + 1`, updatedAt: new Date() })
    .where(and(eq(contentDrafts.id, id), eq(contentDrafts.status, "READY"), eq(contentDrafts.revision, expectedRevision)))
    .run();
  if (res.changes !== 1) throw new DraftStaleError(`edit ไม่สำเร็จ: revision ไม่ตรง/ไม่ใช่ READY (id=${id})`);
  return getDraft(db, id)!;
}

export interface RegenClaim {
  draft: ContentDraft;
  /** token สำหรับ gen รอบนี้ (null = replay ของ attemptKey เดิม → อย่า gen ซ้ำ) */
  token: string | null;
  replay: boolean;
}

/**
 * claim เพื่อ regen ทั้งชุด (จงใจ gen ใหม่) — ต้อง attemptKey ใหม่ + expectedRevision [ตู๋ P1.D].
 * same attemptKey → replay (คืนสถานะปัจจุบัน ไม่ gen ซ้ำ). claim ได้จาก READY/FAILED ที่ revision ตรง
 * หรือ GENERATING ที่ lease หมดอายุ (stuck). คืน token → caller gen แล้ว complete/fail.
 * @throws DraftStaleError ถ้า claim ไม่ได้ (revision ไม่ตรง/กำลัง gen อยู่/finalized)
 */
export function claimRegen(db: ContentDb, id: string, attemptKey: string, expectedRevision: number): RegenClaim {
  return db.transaction((tx) => {
    const cur = tx.select().from(contentDrafts).where(eq(contentDrafts.id, id)).get();
    if (!cur) throw new DraftStaleError(`ไม่พบ draft: ${id}`);
    // FINALIZED = read-only — เช็คก่อน replay [ตู๋ P2] (กัน attemptKey เดิม replay คืน draft ที่ finalize ไปแล้ว)
    if (cur.status === "FINALIZED") throw new DraftStaleError("draft finalized แล้ว (read-only)");
    if (cur.attemptKey === attemptKey) return { draft: cur, token: null, replay: true };

    // revision ต้องตรงเสมอ — ทั้ง fresh และ stale-lease [ตู๋ P1.2] (กัน reclaim paid regen ด้วย revision ค้าง)
    if (cur.revision !== expectedRevision) {
      throw new DraftStaleError(`regen claim ไม่ได้: revision=${cur.revision} (expected ${expectedRevision})`);
    }
    const staleLease = cur.status === "GENERATING" && !!cur.generatingAt && Date.now() - cur.generatingAt.getTime() > STALE_LEASE_MS;
    const statusAllows = cur.status === "READY" || cur.status === "FAILED" || staleLease;
    if (!statusAllows) {
      throw new DraftStaleError(`regen claim ไม่ได้: status=${cur.status} (กำลัง gen อยู่ ยังไม่หมดอายุ)`);
    }
    const token = crypto.randomUUID();
    const res = tx
      .update(contentDrafts)
      .set({ status: "GENERATING", generationToken: token, generatingAt: new Date(), attemptKey, revision: sql`${contentDrafts.revision} + 1`, updatedAt: new Date() })
      .where(and(eq(contentDrafts.id, id), eq(contentDrafts.revision, cur.revision))) // guard: ไม่มีใครแทรกระหว่าง read→write
      .run();
    if (res.changes !== 1) throw new DraftStaleError(`regen claim race: id=${id}`);
    return { draft: tx.select().from(contentDrafts).where(eq(contentDrafts.id, id)).get()!, token, replay: false };
  });
}

export interface FinalizeResult {
  contentPostId: string;
  replay: boolean;
}

/**
 * finalize: snapshot FinalInput → สร้าง contentPost (PENDING) แบบ atomic + mark draft FINALIZED [ตู๋ P1.A].
 * กัน double-finalize 3 ชั้น: finalizeKey replay + contentPostId NULL guard + contentPosts.requestKey unique.
 * @throws DraftStaleError ถ้า revision ไม่ตรง/ไม่ใช่ READY/finalized ไปแล้วด้วย key อื่น
 */
export function finalizeDraft(
  db: ContentDb,
  id: string,
  finalizeKey: string,
  expectedRevision: number,
  finalInput: Record<string, unknown>,
  templateId: string,
): FinalizeResult {
  return db.transaction((tx) => {
    const cur = tx.select().from(contentDrafts).where(eq(contentDrafts.id, id)).get();
    if (!cur) throw new DraftStaleError(`ไม่พบ draft: ${id}`);
    // replay ของ finalize เดิม → คืน post เดิม (idempotent)
    if (cur.finalizeKey === finalizeKey && cur.contentPostId) return { contentPostId: cur.contentPostId, replay: true };
    if (cur.contentPostId) throw new DraftConflictError("draft ถูก finalize ไปแล้ว (double-finalize)");
    if (cur.status !== "READY" || cur.revision !== expectedRevision) {
      throw new DraftStaleError(`finalize ไม่ได้: status=${cur.status} revision=${cur.revision} (expected ${expectedRevision})`);
    }
    const postId = crypto.randomUUID();
    try {
      tx.insert(contentPosts)
        .values({ id: postId, requestKey: `draft:${id}`, templateId, inputData: finalInput, status: "PENDING" })
        .run(); // requestKey unique = backstop กัน 2 post จาก draft เดียว
    } catch (e) {
      // เฉพาะ daily-7 active fence (idx uniq_daily7_active) → domain result 409 (ไม่ใช่ 500) [PR#101 ตู๋ P1.2]
      // unique อื่น (เช่น request_key) / error อื่น → throw เดิม ไม่กลืน domain [ตู๋ P1 re-review]
      if (isDaily7ActiveFenceViolation(e)) {
        throw new DraftConflictError("มี content ของวันนี้อยู่แล้ว (daily-7 = 1 โพสต์/วัน) — ยกเลิกตัวเดิมก่อน");
      }
      throw e;
    }
    const res = tx
      .update(contentDrafts)
      .set({ status: "FINALIZED", contentPostId: postId, finalizeKey, revision: sql`${contentDrafts.revision} + 1`, updatedAt: new Date() })
      .where(and(eq(contentDrafts.id, id), eq(contentDrafts.revision, cur.revision), sql`${contentDrafts.contentPostId} IS NULL`))
      .run();
    if (res.changes !== 1) throw new DraftStaleError(`finalize race: id=${id}`);
    return { contentPostId: postId, replay: false };
  });
}
