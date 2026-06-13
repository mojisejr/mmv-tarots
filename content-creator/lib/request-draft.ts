/**
 * request-draft — idempotency key ที่ persist ข้าม reload [S3.5a ตู๋ P1]
 *
 * ปัญหา: requestKey ที่ gen ต่อ mount หายเมื่อ reload → response หาย/timeout แล้ว reload =
 * key ใหม่ = สร้าง row + จ่าย Gemini ซ้ำ. แก้ด้วย persist {key, payload} (localStorage) ข้าม reload:
 *   - payload เดิม (retry/reload) → ใช้ key เดิม → server idempotent ไม่ gen ซ้ำ
 *   - payload เปลี่ยน (ฟีมตั้งใจสร้างใหม่) → key ใหม่ (attempt ใหม่)
 *   - สำเร็จแล้ว → clear (submit ครั้งหน้า = attempt ใหม่)
 *
 * logic ตัดสิน key แยกเป็น pure function (resolveRequestKey) เพื่อ test deterministic.
 */
export type DraftPayload = { templateId: string; card: string; meaning: string };
export type PendingRequest = { requestKey: string; payload: DraftPayload };

const STORAGE_KEY = "cc-pending-create";

function samePayload(a: DraftPayload, b: DraftPayload): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * ตัดสิน requestKey สำหรับ submit:
 *  - ถ้า pending มีอยู่ + payload ตรง → reuse key เดิม (retry/reload idempotent)
 *  - ไม่งั้น → ใช้ newKey (attempt ใหม่) + persist payload ใหม่
 * pure — ไม่แตะ storage (caller เอา .pending ไป persist)
 */
export function resolveRequestKey(
  pending: PendingRequest | null,
  payload: DraftPayload,
  newKey: string,
): PendingRequest {
  if (pending && samePayload(pending.payload, payload)) {
    return pending; // retry เดิม — key เดิม
  }
  return { requestKey: newKey, payload };
}

// ---- localStorage wrappers (thin, guarded — client only) ----
export function readPending(): PendingRequest | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingRequest) : null;
  } catch {
    return null;
  }
}

export function writePending(p: PendingRequest): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage เต็ม/ปิด — best-effort */
  }
}

export function clearPending(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
