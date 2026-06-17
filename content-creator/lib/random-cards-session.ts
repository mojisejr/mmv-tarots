/**
 * random-cards authoring client session lifecycle [PR#103] — pure (ไม่มี DOM/fetch) → test ได้.
 * mirror daily7-session: ใช้ backend idempotency จริง (ไม่จ่าย Gemini ซ้ำตอน lost-response/reload):
 *  - persist {requestKey, finalizeKey, draftId?, pendingAttemptKey?}
 *  - mount: มี draftId → restore (GET) ; มี requestKey แต่ยังไม่มี draftId → resume (POST key เดิม)
 *  - regen reuse pendingAttemptKey (retry response หาย → backend replay) ; "เริ่มใหม่" = key ใหม่
 *  - reduceFinalize: 200 → queue(clear) / 202 → processing(lock) / 502 → failed(reset)
 */
export type Session = {
  requestKey: string;
  finalizeKey: string;
  draftId?: string;
  pendingAttemptKey?: string;
};

export interface DraftView {
  id: string;
  revision: number;
  status: string;
  draftData?: { cardIds?: string[]; quote?: string; body?: string };
  contentPostId?: string | null;
}

/** parse session กัน corrupt → null */
export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<Session>;
    if (typeof s?.requestKey === "string" && typeof s.finalizeKey === "string") {
      return {
        requestKey: s.requestKey,
        finalizeKey: s.finalizeKey,
        draftId: typeof s.draftId === "string" ? s.draftId : undefined,
        pendingAttemptKey: typeof s.pendingAttemptKey === "string" ? s.pendingAttemptKey : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function freshSession(gen: () => string): Session {
  return { requestKey: gen(), finalizeKey: gen() };
}

export interface Reduced {
  revision: number;
  status: string;
  data: { cardIds: string[]; quote: string; body: string } | null;
  postId: string | null;
  session: Session | null; // null = clear (FINALIZED แล้ว)
}

/** draft (create/GET/regen) → view state + session ที่ต้อง persist */
export function reduceDraft(draft: DraftView, session: Session): Reduced {
  const dd = draft.draftData;
  const data = dd?.cardIds && dd.quote != null && dd.body != null ? { cardIds: dd.cardIds, quote: dd.quote, body: dd.body } : null;
  if (draft.status === "FINALIZED") {
    return { revision: draft.revision, status: "FINALIZED", data, postId: draft.contentPostId ?? null, session: null };
  }
  return { revision: draft.revision, status: draft.status, data, postId: null, session: { ...session, draftId: draft.id } };
}

export type MountAction =
  | { kind: "none" }
  | { kind: "restore"; draftId: string }
  | { kind: "resume"; requestKey: string };

export function mountAction(session: Session | null): MountAction {
  if (!session) return { kind: "none" };
  if (session.draftId) return { kind: "restore", draftId: session.draftId };
  return { kind: "resume", requestKey: session.requestKey };
}

/** regen: reuse pendingAttemptKey ถ้ามี (retry response หาย → replay) ; ไม่มี = สุ่มชุดใหม่ */
export function regenAttemptKey(session: Session, gen: () => string): string {
  return session.pendingAttemptKey ?? gen();
}

/** ปุ่ม primary: new (key ใหม่) / resume (create response หาย → POST key เดิม ไม่จ่ายซ้ำ) / restart (มี draft → confirm) */
export function createButtonMode(session: Session | null): "new" | "resume" | "restart" {
  if (!session) return "new";
  if (!session.draftId) return "resume";
  return "restart";
}

export type FinalizeResponse = { ok: boolean; definitive: boolean; status: string; error?: string };
export type FinalizeOutcome =
  | { kind: "queue" }
  | { kind: "processing"; message: string }
  | { kind: "failed"; message: string };

/** finalize response → client state (server lock draft=FINALIZED แล้ว → ห้ามถือ READY ต่อ) */
export function reduceFinalize(r: FinalizeResponse): FinalizeOutcome {
  if (r.ok && r.definitive) return { kind: "queue" };
  if (!r.definitive) return { kind: "processing", message: "ยืนยันแล้ว · กำลังสร้างภาพ — ดูในคิวโพสต์ หรือกดเช็คอีกครั้ง (ระบบไม่จ่าย/สร้างซ้ำ)" };
  return { kind: "failed", message: `สร้างภาพไม่สำเร็จ: ${r.error ?? "ตรวจ CTA url ใน Settings"} — ชุดนี้ปิดแล้ว สุ่มใหม่ได้` };
}
