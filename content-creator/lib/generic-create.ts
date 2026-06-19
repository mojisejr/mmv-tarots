/**
 * generic content authoring — client session/idempotency (pure, ไม่มี DOM/fetch → test ได้) [Phase C]
 *
 * แยกจาก finance `request-draft.ts` 100% (storage key + payload คนละแบบ) [too P2.5 collision].
 * จุดประสงค์: lost-response/reload ใช้ backend idempotency จริง (requestKey เดิม → ไม่จ่าย genObject/caption ซ้ำ):
 *  - persist {requestKey, type, draftId?} (localStorage key เฉพาะ generic)
 *  - submit: type เดิม → reuse key เดิม (retry idempotent) ; type เปลี่ยน → key ใหม่
 *  - mount: มี session → resume (POST key เดิม + type เดิม) → backend advance/replay
 *  - outcome: success/failed/stale → clear ; in-progress/unknown → keep (retry idempotent)
 */
const STORAGE_KEY = "cc-pending-generic"; // ห้ามชน finance "cc-pending-create"

export type GenericSession = {
  requestKey: string;
  /** canonical-ish type ที่ผู้ใช้กรอก (เทียบ identity ของ submit นี้) */
  type: string;
  draftId?: string;
};

/** parse session กัน corrupt (JSON เสีย/ขาด field) → null [too P2.1] */
export function parseSession(raw: string | null): GenericSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<GenericSession>;
    if (typeof s?.requestKey === "string" && typeof s.type === "string") {
      return { requestKey: s.requestKey, type: s.type, draftId: typeof s.draftId === "string" ? s.draftId : undefined };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * ตัดสิน session สำหรับ submit:
 *  - session เดิม + type ตรง → reuse key เดิม (retry/reload idempotent)
 *  - ไม่งั้น → key ใหม่ (attempt ใหม่)
 * pure — caller เอา result ไป persist
 */
export function resolveGenericSession(session: GenericSession | null, type: string, newKey: string): GenericSession {
  if (session && session.type === type) return session;
  return { requestKey: newKey, type };
}

export type GenericOutcome = "success" | "failed" | "in-progress" | "stale" | "unknown";

export type GenericResponseBody = {
  definitive?: boolean;
  ok?: boolean;
  inProgress?: boolean;
  stale?: boolean;
};

/**
 * classify response → outcome [§1.1]:
 *  - stale (202 GENERATING ค้าง process ตาย) → "stale" (เริ่มใหม่ key ใหม่)
 *  - 202/inProgress → "in-progress" (lock UI, เก็บ key, replay ได้)
 *  - definitive → ok? "success" : "failed"
 *  - อื่น (400/409/500/network) → "unknown" (เก็บ key, retry idempotent)
 */
export function classifyGenericResponse(httpStatus: number, body: GenericResponseBody): GenericOutcome {
  if (body.stale) return "stale";
  if (httpStatus === 202 || body.inProgress) return "in-progress";
  if (body.definitive) return body.ok ? "success" : "failed";
  return "unknown";
}

/** clear session เมื่อ terminal (สำเร็จ/ล้มจริง) หรือ stale (draft orphan → เริ่มใหม่ key ใหม่) */
export function shouldClearSession(outcome: GenericOutcome): boolean {
  return outcome === "success" || outcome === "failed" || outcome === "stale";
}

/** mount: มี session → resume (POST key+type เดิม) ; ไม่มี → none */
export type MountAction = { kind: "none" } | { kind: "resume"; requestKey: string; type: string };
export function mountAction(session: GenericSession | null): MountAction {
  if (!session) return { kind: "none" };
  return { kind: "resume", requestKey: session.requestKey, type: session.type };
}

// ---- localStorage wrappers (thin, guarded — client only) ----
export function readSession(): GenericSession | null {
  try {
    return parseSession(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
export function writeSession(s: GenericSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage เต็ม/ปิด — best-effort */
  }
}
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
