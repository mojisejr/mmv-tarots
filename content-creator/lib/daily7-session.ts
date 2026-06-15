/**
 * daily-7 authoring client session lifecycle [S6c.2] — pure (ไม่มี DOM/fetch) → test ได้
 *
 * จุดประสงค์: recovery จาก lost-response/reload ให้ใช้ backend idempotency จริง (ไม่จ่าย Gemini ซ้ำ):
 *  - persist {requestKey, finalizeKey, targetDate, draftId?, pendingAttemptKey?} (localStorage)
 *  - mount: มี draftId → restore (GET) ; มี requestKey แต่ยังไม่มี draftId → resume (POST key เดิม)
 *  - reduceDraft: FINALIZED → อ่าน contentPostId + clear session (กัน finalize-response หาย แล้วค้าง)
 *  - regen reuse pendingAttemptKey (retry response หาย) ; "เริ่มใหม่" = key ชุดใหม่ (intentional)
 */
export type Session = {
  requestKey: string;
  targetDate: string;
  finalizeKey: string;
  draftId?: string;
  pendingAttemptKey?: string;
};

export interface DraftView {
  id: string;
  revision: number;
  status: string;
  draftData?: { days?: { day: string; fortune: string }[] };
  contentPostId?: string | null;
}

/** parse session แบบกัน corrupt (JSON เสีย/ขาด field) → null [ตู๋ P2] */
export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<Session>;
    if (typeof s?.requestKey === "string" && typeof s.targetDate === "string" && typeof s.finalizeKey === "string") {
      return {
        requestKey: s.requestKey,
        targetDate: s.targetDate,
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

export function freshSession(targetDate: string, gen: () => string): Session {
  return { requestKey: gen(), targetDate, finalizeKey: gen() };
}

export interface Reduced {
  revision: number;
  status: string;
  days: { day: string; fortune: string }[];
  postId: string | null;
  /** session ที่ต้อง persist (null = clear — เช่น FINALIZED แล้ว) */
  session: Session | null;
}

/** draft (จาก create/GET/patch/regen) → view state + session ที่ต้อง persist */
export function reduceDraft(draft: DraftView, session: Session): Reduced {
  const days = draft.draftData?.days ?? [];
  if (draft.status === "FINALIZED") {
    return { revision: draft.revision, status: "FINALIZED", days, postId: draft.contentPostId ?? null, session: null };
  }
  return { revision: draft.revision, status: draft.status, days, postId: null, session: { ...session, draftId: draft.id } };
}

export type MountAction =
  | { kind: "none" }
  | { kind: "restore"; draftId: string } // มี draftId → GET
  | { kind: "resume"; requestKey: string; targetDate: string }; // pending create (response หาย) → POST key เดิม

/** mount: จะทำอะไรกับ session ที่ restore มา (recovery decision) */
export function mountAction(session: Session | null): MountAction {
  if (!session) return { kind: "none" };
  if (session.draftId) return { kind: "restore", draftId: session.draftId };
  return { kind: "resume", requestKey: session.requestKey, targetDate: session.targetDate };
}

/** regen: reuse pendingAttemptKey ถ้ามี (retry ที่ response หาย → backend replay) ; ไม่มี = regen ใหม่ */
export function regenAttemptKey(session: Session, gen: () => string): string {
  return session.pendingAttemptKey ?? gen();
}

/**
 * mode ของปุ่ม primary ตาม session (รวม same-mount ไม่ reload) [ตู๋ P1]:
 *  - ไม่มี session → "new" (key ชุดใหม่)
 *  - session แต่ยังไม่มี draftId (create response หาย แม้ยังไม่ reload) → "resume" (POST key **เดิม** ไม่จ่าย Gemini ซ้ำ)
 *  - มี draftId แล้ว → "restart" (intentional เริ่มใหม่ — secondary, confirm + key ใหม่)
 */
export function createButtonMode(session: Session | null): "new" | "resume" | "restart" {
  if (!session) return "new";
  if (!session.draftId) return "resume";
  return "restart";
}
