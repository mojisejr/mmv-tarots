/**
 * content-creator — single atomic transition API ของ ContentPost.status [P1.2]
 *
 * ทำไมต้องมี: read→assert→update ไม่ atomic — concurrent approve/cancel/scheduler อ่าน state เดียวกัน
 * แล้ว overwrite กัน/post ซ้ำได้ และ caller bypass state machine ด้วย raw update ได้.
 * แก้: conditional update `WHERE id=? AND status=expectedFrom`, ตรวจ changes===1 (ไม่งั้น stale/concurrent).
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
 * เปลี่ยน status แบบ atomic + conditional. throw ถ้า:
 *  - transition ไม่ allowed (state machine)
 *  - row ไม่ตรง (id ไม่มี หรือ status ปัจจุบัน ≠ from = stale/concurrent)
 */
export function transition(
  db: ContentDb,
  id: string,
  from: ContentStatus,
  to: ContentStatus,
  patch: TransitionPatch = {},
): void {
  assertTransition(from, to); // validate transition ที่อนุญาต (เร็ว, fail ก่อนแตะ DB)

  const res = db
    .update(contentPosts)
    .set({ status: to, updatedAt: new Date(), ...patch })
    .where(and(eq(contentPosts.id, id), eq(contentPosts.status, from)))
    .run();

  if (res.changes !== 1) {
    throw new Error(
      `stale/concurrent transition: id=${id} ${from}→${to} — row ไม่ตรง (status ปัจจุบัน ≠ ${from}, changes=${res.changes})`,
    );
  }
}
