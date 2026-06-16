/**
 * shared publish policy [S4b ตู๋ P1] — manual + scheduler ใช้ตัวเดียวกัน (ไม่ bypass)
 *
 * ลำดับ (carry-forward S4a + guardrail S4b):
 *  preflight (APPROVED + มี caption/image) → staleness guard (daily-7 targetDate=วันนี้)
 *  → claimForPublish (atomic + per-day fence) → upload (pre-feed: ล้ม release→APPROVED retry ได้)
 *  → POINT OF NO RETURN: publishToFeed (ล้ม=AMBIGUOUS คง PUBLISHING ห้าม release/retry)
 *  → markPosted (ล้ม=AMBIGUOUS โพสต์แล้วแต่ DB ค้าง — reconcile มือ)
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { and, eq } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { contentPosts, type ContentPost } from "./db/schema";
import { claimForPublish, markPosted, releaseClaim, markFeedAttempted } from "./db/transition";
import { uploadUnpublishedPhoto, publishToFeed } from "./lib/facebook";
import { safeResolveUnderRoot } from "./lib/safe-path";
import { bangkokTodayISO } from "./lib/time";

const DAILY7 = "daily-7";

/** ผลลัพธ์ publish — definitive vs ต้อง reconcile มือ */
export type PublishOutcome =
  | { ok: true; status: "POSTED"; fbPostId: string }
  | { ok: false; status: "SKIPPED" | "STALE" | "RETRYABLE" | "AMBIGUOUS"; reason: string; fbPostId?: string };

/** staleness guard (shared): daily-7 targetDate ต้อง = วันนี้ — ไม่งั้น STALE (ไม่โพสต์ของผิดวัน) */
export function staleReason(row: Pick<ContentPost, "templateId" | "inputData">, today: string): string | null {
  if (row.templateId !== DAILY7) return null;
  const targetDate = (row.inputData as { targetDate?: string })?.targetDate;
  if (targetDate !== today) return `daily-7 targetDate=${targetDate ?? "?"} ≠ วันนี้ (${today}) — ไม่โพสต์`;
  return null;
}

export interface PublishDeps {
  pageId: string;
  token: string;
  /** วันนี้ (Bangkok) — inject ได้สำหรับ test ; default = วันนี้จริง */
  today?: string;
}

export async function publishApprovedPost(db: ContentDb, id: string, deps: PublishDeps): Promise<PublishOutcome> {
  const today = deps.today ?? bangkokTodayISO();
  const row = db.select().from(contentPosts).where(eq(contentPosts.id, id)).get();
  if (!row) return { ok: false, status: "SKIPPED", reason: "ไม่พบโพสต์" };
  if (row.status !== "APPROVED") return { ok: false, status: "SKIPPED", reason: `ไม่ใช่ APPROVED (${row.status})` };
  if (!row.caption || !row.imagePath) return { ok: false, status: "SKIPPED", reason: "ไม่มี caption/image" };

  const stale = staleReason(row, today);
  if (stale) return { ok: false, status: "STALE", reason: stale }; // ไม่ claim/ไม่ยิง FB

  // claim atomic + per-day fence (daily-7 วันเดียวกัน row อื่น claim ไม่ได้)
  if (!claimForPublish(db, id)) {
    return { ok: false, status: "SKIPPED", reason: "claim ไม่ได้ (ถูกยิงอยู่ / per-day fence / ไม่ใช่ APPROVED)" };
  }

  // ===== UPLOAD (pre-feed) — ยังไม่โพสต์ → ล้ม release→APPROVED ปลอดภัย (retry) =====
  let mediaFbid = row.mediaFbid;
  if (!mediaFbid) {
    try {
      const mediaDir = process.env.CONTENT_MEDIA_DIR || "content-creator/media";
      const real = safeResolveUnderRoot(mediaDir, basename(row.imagePath));
      if (!real) throw new Error(`image path ไม่ปลอดภัย/ไม่พบ: ${row.imagePath}`);
      mediaFbid = await uploadUnpublishedPhoto({ pageId: deps.pageId, token: deps.token, bytes: new Uint8Array(readFileSync(real)) });
      const upd = db
        .update(contentPosts)
        .set({ mediaFbid, updatedAt: new Date() })
        .where(and(eq(contentPosts.id, id), eq(contentPosts.status, "PUBLISHING")))
        .run();
      if (upd.changes !== 1) throw new Error("ownership lost: status ไม่ใช่ PUBLISHING");
    } catch (e) {
      releaseClaim(db, id, "APPROVED"); // ยังไม่โพสต์ → retry ปลอดภัย
      return { ok: false, status: "RETRYABLE", reason: e instanceof Error ? e.message : String(e) };
    }
  }

  // ===== POINT OF NO RETURN — mark ก่อนยิง (reconcile จะไม่ auto-release หลังจุดนี้) แล้ว POST /feed =====
  let postId: string;
  try {
    markFeedAttempted(db, id); // PONR marker [S4b ตู๋ P1] — worker ตายหลังจุดนี้ = ambiguous ห้าม auto-release
    postId = await publishToFeed({ pageId: deps.pageId, token: deps.token, mediaFbid, message: row.caption });
  } catch (e) {
    // AMBIGUOUS — คง PUBLISHING ไม่ release/ไม่ retry (กันโพสต์ซ้ำ) → reconcile มือ
    return { ok: false, status: "AMBIGUOUS", reason: `publish กำกวม คง PUBLISHING: ${e instanceof Error ? e.message : String(e)}` };
  }
  try {
    markPosted(db, id, postId);
  } catch (e) {
    return { ok: false, status: "AMBIGUOUS", fbPostId: postId, reason: `โพสต์ขึ้นแล้ว (fbPostId=${postId}) แต่ DB ล้ม — reconcile มือ ห้าม retry: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { ok: true, status: "POSTED", fbPostId: postId };
}
