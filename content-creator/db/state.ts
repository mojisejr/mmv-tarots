/**
 * content-creator state machine — transitions ที่อนุญาตของ ContentPost.status
 *
 * PENDING ─claim→ GENERATING ─gen สำเร็จ→ GENERATED ─approve(คน)→ APPROVED ─claim→ PUBLISHING ─post→ POSTED (terminal)
 *   GENERATING ─recovery→ FAILED / PENDING   (gen ล้ม/ปล่อย claim)
 *   PUBLISHING ─recovery→ FAILED / APPROVED   (ยิง FB ล้ม/ปล่อย claim)
 *   (active state) ─→ CANCELED (terminal) ; ─error→ FAILED ─retry→ PENDING
 *
 * GENERATING/PUBLISHING = lease: worker ต้อง claim (atomic) ก่อนทำ external side-effect
 *   - GENERATING: claim ก่อนเรียก Gemini (กัน concurrent gen ซ้ำ/เปลือง cost) [S2]
 *   - PUBLISHING: claim ก่อนยิง Facebook (กัน post ซ้ำ) [S4 / ตู๋ altitude]
 */
import type { ContentStatus } from "./schema";

/** transitions ที่อนุญาต: from → [to, ...] */
const ALLOWED: Record<ContentStatus, readonly ContentStatus[]> = {
  PENDING: ["GENERATING", "CANCELED", "FAILED"], // GENERATING = claim ก่อนเรียก Gemini
  GENERATING: ["GENERATED", "FAILED"], // GENERATED=สำเร็จ ; FAILED=ล้ม. (ถอด →PENDING: reclaim ต้อง expiry+token ก่อน [ตู๋ P1] — ตอนนี้ retry ผ่าน FAILED→PENDING)
  GENERATED: ["APPROVED", "CANCELED", "FAILED"], // APPROVED = human gate
  APPROVED: ["PUBLISHING", "CANCELED", "FAILED"], // PUBLISHING = claim ก่อนยิง FB
  PUBLISHING: ["POSTED", "FAILED", "APPROVED"], // POSTED=สำเร็จ ; FAILED/APPROVED=recovery (ปล่อย claim)
  POSTED: [], // terminal
  CANCELED: [], // terminal
  FAILED: ["PENDING"], // retry
};

export const TERMINAL_STATUSES: readonly ContentStatus[] = ["POSTED", "CANCELED"];

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return ALLOWED[from].includes(to);
}

/** @throws Error ถ้า transition ไม่ถูกต้อง */
export function assertTransition(from: ContentStatus, to: ContentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid content status transition: ${from} → ${to}`);
  }
}

export function isTerminal(status: ContentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
