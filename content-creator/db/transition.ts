/**
 * content-creator — atomic transition API ของ ContentPost.status [ตู๋ P1.2 + altitude]
 *
 * conditional update `WHERE id=? AND status=expectedFrom` + ตรวจ changes===1:
 *  - กัน bypass state machine + concurrent overwrite
 *  - PUBLISHING claim: worker ที่ claim ได้ (changes 1) คนเดียว ยิง Facebook → กันโพสต์ซ้ำ
 */
import { and, eq } from "drizzle-orm";
import type { ContentDb } from "./client";
import { contentPosts, type ContentStatus } from "./schema";
import { assertTransition } from "./state";

/** field ที่อนุญาตให้ set พร้อม transition (ไม่ให้ set status ตรง ๆ — ผ่าน to เท่านั้น) */
export type TransitionPatch = Partial<
  Pick<typeof contentPosts.$inferInsert, "caption" | "imagePath" | "mediaFbid" | "fbPostId" | "postedAt" | "publishAt">
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
 * claim โพสต์เพื่อยิง Facebook (APPROVED → PUBLISHING แบบ atomic).
 * คืน true = worker นี้ claim ได้ (ยิง FB ต่อได้คนเดียว); false = worker อื่น claim ไปแล้ว → skip.
 * กัน scheduler concurrent ยิง Facebook ซ้ำ. หลังยิงเสร็จ caller → markPosted/releaseClaim.
 */
export function claimForPublish(db: ContentDb, id: string): boolean {
  return tryTransition(db, id, "APPROVED", "PUBLISHING");
}

/** ยิง FB สำเร็จแล้ว: PUBLISHING → POSTED (เก็บ fbPostId + postedAt) */
export function markPosted(db: ContentDb, id: string, fbPostId: string): void {
  transition(db, id, "PUBLISHING", "POSTED", { fbPostId, postedAt: new Date() });
}

/** ยิง FB ล้ม/ต้องปล่อย claim: PUBLISHING → FAILED (default) หรือ APPROVED (คืนคิว) */
export function releaseClaim(db: ContentDb, id: string, to: "FAILED" | "APPROVED" = "FAILED"): void {
  transition(db, id, "PUBLISHING", to);
}
