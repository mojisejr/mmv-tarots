/**
 * content-creator state machine — transitions ที่อนุญาตของ ContentPost.status
 *
 * PENDING ──gen──▶ GENERATED ──approve(คน)──▶ APPROVED ──post──▶ POSTED (terminal)
 *    └─────────────────┴────────────────────────┴──────▶ CANCELED (terminal)
 *    (ทุก active state) ──error──▶ FAILED ──retry──▶ PENDING
 */
import type { ContentStatus } from "./schema";

/** transitions ที่อนุญาต: from → [to, ...] */
const ALLOWED: Record<ContentStatus, readonly ContentStatus[]> = {
  PENDING: ["GENERATED", "CANCELED", "FAILED"],
  GENERATED: ["APPROVED", "CANCELED", "FAILED"], // APPROVED = human gate
  APPROVED: ["POSTED", "CANCELED", "FAILED"],
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
