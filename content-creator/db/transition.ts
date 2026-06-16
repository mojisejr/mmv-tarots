/**
 * content-creator — atomic transition API ของ ContentPost.status [ตู๋ P1.2 + altitude]
 *
 * conditional update `WHERE id=? AND status=expectedFrom` + ตรวจ changes===1:
 *  - กัน bypass state machine + concurrent overwrite
 *  - PUBLISHING claim: worker ที่ claim ได้ (changes 1) คนเดียว ยิง Facebook → กันโพสต์ซ้ำ
 */
import { and, eq, isNull, lt } from "drizzle-orm";
import type { ContentDb } from "./client";
import { contentPosts, type ContentStatus } from "./schema";
import { assertTransition } from "./state";

/** field ที่อนุญาตให้ set พร้อม transition (ไม่ให้ set status ตรง ๆ — ผ่าน to เท่านั้น) */
export type TransitionPatch = Partial<
  Pick<typeof contentPosts.$inferInsert, "caption" | "imagePath" | "mediaFbid" | "fbPostId" | "postedAt" | "publishAt" | "publishStartedAt" | "feedAttemptedAt">
>;

/**
 * พยายาม transition แบบ atomic conditional. คืน true ถ้าสำเร็จ (claim ได้), false ถ้า row ไม่ตรง
 * (stale/concurrent/ไม่มี id). ไม่ throw — เหมาะกับ worker ที่ "ลอง claim แล้ว skip ถ้าไม่ได้".
 * @throws เฉพาะกรณี transition ไม่ allowed ตาม state machine (programmer error)
 */
export function tryTransition(
  db: ContentDb,
  id: string,
  from: ContentStatus,
  to: ContentStatus,
  patch: TransitionPatch = {},
): boolean {
  assertTransition(from, to); // validate transition ที่อนุญาต (fail เร็วก่อนแตะ DB)
  const res = db
    .update(contentPosts)
    .set({ status: to, updatedAt: new Date(), ...patch })
    .where(and(eq(contentPosts.id, id), eq(contentPosts.status, from)))
    .run();
  return res.changes === 1;
}

/** transition แบบ strict — throw ถ้า row ไม่ตรง (stale/concurrent) */
export function transition(
  db: ContentDb,
  id: string,
  from: ContentStatus,
  to: ContentStatus,
  patch: TransitionPatch = {},
): void {
  if (!tryTransition(db, id, from, to, patch)) {
    throw new Error(`stale/concurrent transition: id=${id} ${from}→${to} — row ไม่ตรง (status ปัจจุบัน ≠ ${from})`);
  }
}

/**
 * claim เพื่อเรียก Gemini gen (PENDING → GENERATING แบบ atomic + ออก ownership token). [S2 P1]
 * คืน **token** ถ้า claim ได้ (worker เดียว) ; null ถ้า skip (ไม่ใช่ PENDING/claim ไปแล้ว).
 * token ต้องส่งคืนใน markGenerated/releaseGenerate → กัน stale worker (ที่ถูก reclaim) ทับ attempt ใหม่.
 */
export function claimForGenerate(db: ContentDb, id: string): string | null {
  const token = crypto.randomUUID();
  const res = db
    .update(contentPosts)
    .set({ status: "GENERATING", generationToken: token, generatingAt: new Date(), updatedAt: new Date() })
    .where(and(eq(contentPosts.id, id), eq(contentPosts.status, "PENDING")))
    .run();
  return res.changes === 1 ? token : null;
}

/**
 * gen สำเร็จ: GENERATING → GENERATED (เก็บ caption + imagePath), **เฉพาะถ้า token ตรง**.
 * คืน false = superseded (worker เก่าโดน reclaim — ไม่ทับ attempt ใหม่)
 */
export function markGenerated(db: ContentDb, id: string, token: string, caption: string, imagePath: string): boolean {
  const res = db
    .update(contentPosts)
    .set({ status: "GENERATED", caption, imagePath, generationToken: null, generatingAt: null, updatedAt: new Date() })
    .where(and(eq(contentPosts.id, id), eq(contentPosts.status, "GENERATING"), eq(contentPosts.generationToken, token)))
    .run();
  return res.changes === 1;
}

/**
 * gen ล้ม/ปล่อย claim: GENERATING → FAILED **เฉพาะถ้า token ตรง** (กัน worker เก่าทำ attempt ใหม่ FAILED).
 * คืน false = superseded (ไม่ทับ)
 */
export function releaseGenerate(db: ContentDb, id: string, token: string): boolean {
  const res = db
    .update(contentPosts)
    .set({ status: "FAILED", generationToken: null, generatingAt: null, updatedAt: new Date() })
    .where(and(eq(contentPosts.id, id), eq(contentPosts.status, "GENERATING"), eq(contentPosts.generationToken, token)))
    .run();
  return res.changes === 1;
}

/** unique-constraint violation ของ better-sqlite3 (per-day fence ชน) */
function isUniqueViolation(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (e as { code?: string })?.code === "SQLITE_CONSTRAINT_UNIQUE" || /UNIQUE constraint failed/i.test(msg);
}

/**
 * claim โพสต์เพื่อยิง Facebook (APPROVED → PUBLISHING แบบ atomic).
 * คืน true = worker นี้ claim ได้ (ยิง FB ต่อได้คนเดียว); false = claim ไม่ได้ — ได้ 2 กรณี:
 *   (a) row ไม่ใช่ APPROVED (worker อื่น claim ไป) — changes 0
 *   (b) per-day fence ชน: daily-7 วันเดียวกันมี row อื่นใน PUBLISHING/POSTED แล้ว → unique index
 *       violation [S4b ตู๋ P1] (กัน 2 row คนละ id วันเดียวกันโพสต์คู่)
 * กัน scheduler concurrent + 2 row/วัน ยิง Facebook ซ้ำ. หลังยิงเสร็จ caller → markPosted/releaseClaim.
 */
export function claimForPublish(db: ContentDb, id: string): boolean {
  try {
    // set publishStartedAt (lease) + เคลียร์ feedAttemptedAt (fresh claim, ยังไม่ถึง PONR) [S4b ตู๋ P1]
    return tryTransition(db, id, "APPROVED", "PUBLISHING", { publishStartedAt: new Date(), feedAttemptedAt: null });
  } catch (e) {
    if (isUniqueViolation(e)) return false; // per-day fence ชน → ถือว่า claim ไม่ได้ (วันนี้โพสต์/กำลังโพสต์แล้ว)
    throw e;
  }
}

/**
 * PONR marker [S4b ตู๋ P1] — set feedAttemptedAt ก่อนยิง POST /feed (เฉพาะ token ตรง = ยัง PUBLISHING).
 * หลังจุดนี้ reconcile จะ "ไม่ auto-release" (ambiguous อาจโพสต์แล้ว). @throws ถ้า row ไม่ใช่ PUBLISHING
 */
export function markFeedAttempted(db: ContentDb, id: string): void {
  const res = db
    .update(contentPosts)
    .set({ feedAttemptedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(contentPosts.id, id), eq(contentPosts.status, "PUBLISHING")))
    .run();
  if (res.changes !== 1) throw new Error(`markFeedAttempted: row ไม่ใช่ PUBLISHING (id=${id})`);
}

/**
 * reconcile stuck PUBLISHING [S4b ตู๋ P1] — worker ตายหลัง claim:
 *  - pre-PONR (feedAttemptedAt IS NULL) + lease หมดอายุ → release กลับ APPROVED (ยังไม่ยิง retry ปลอดภัย)
 *  - post-PONR (feedAttemptedAt NOT NULL) → **ไม่แตะ** (ambiguous — คง PUBLISHING ให้ reconcile มือ)
 * คืนจำนวนที่ release. cutoff = เวลาที่เก่ากว่านี้ถือว่า stuck.
 */
export function reconcileStuckPublishing(db: ContentDb, cutoff: Date): number {
  const res = db
    .update(contentPosts)
    .set({ status: "APPROVED", publishStartedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(contentPosts.status, "PUBLISHING"),
        isNull(contentPosts.feedAttemptedAt), // pre-PONR เท่านั้น (ยังไม่ยิง feed)
        lt(contentPosts.publishStartedAt, cutoff),
      ),
    )
    .run();
  return res.changes;
}

/** ยิง FB สำเร็จแล้ว: PUBLISHING → POSTED (เก็บ fbPostId + postedAt) */
export function markPosted(db: ContentDb, id: string, fbPostId: string): void {
  transition(db, id, "PUBLISHING", "POSTED", { fbPostId, postedAt: new Date() });
}

/** ยิง FB ล้ม/ต้องปล่อย claim: PUBLISHING → FAILED (default) หรือ APPROVED (คืนคิว) + เคลียร์ lease marker */
export function releaseClaim(db: ContentDb, id: string, to: "FAILED" | "APPROVED" = "FAILED"): void {
  transition(db, id, "PUBLISHING", to, { publishStartedAt: null, feedAttemptedAt: null });
}
