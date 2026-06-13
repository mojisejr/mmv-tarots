/**
 * content-creator state machine — transitions ที่อนุญาตของ ContentPost.status
 *
 * PENDING ─gen→ GENERATED ─approve(คน)→ APPROVED ─claim→ PUBLISHING ─post สำเร็จ→ POSTED (terminal)
 *   PUBLISHING ─recovery→ FAILED / APPROVED   (ยิง FB ล้ม/ปล่อย claim)
 *   (active state) ─→ CANCELED (terminal) ; ─error→ FAILED ─retry→ PENDING
 *
 * PUBLISHING = lease: worker ต้อง claim (APPROVED→PUBLISHING แบบ atomic) ก่อนยิง Facebook
 * → กัน scheduler concurrent โพสต์ซ้ำ (side effect ภายนอก) [ตู๋ P1 altitude]
 */
import type { ContentStatus } from "./schema";

/** transitions ที่อนุญาต: from → [to, ...] */
const ALLOWED: Record<ContentStatus, readonly ContentStatus[]> = {
  PENDING: ["GENERATED", "CANCELED", "FAILED"],
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
