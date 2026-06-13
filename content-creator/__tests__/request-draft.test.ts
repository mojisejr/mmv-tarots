import { describe, it, expect } from "vitest";
import { resolveRequestKey } from "../lib/request-draft";

const payload = { templateId: "finance-daily", card: "The Sun", meaning: "การเงินสดใส" };

describe("resolveRequestKey — idempotency key ข้าม reload [ตู๋ P1]", () => {
  it("ไม่มี pending → ใช้ newKey + เก็บ payload", () => {
    const r = resolveRequestKey(null, payload, "new-1");
    expect(r.requestKey).toBe("new-1");
    expect(r.payload).toEqual(payload);
  });

  it("pending payload เดิม (reload/retry) → reuse key เดิม → ไม่ gen ซ้ำ", () => {
    const r = resolveRequestKey({ requestKey: "k-1", payload }, payload, "new-2");
    expect(r.requestKey).toBe("k-1");
  });

  it("payload เปลี่ยน (ฟีมตั้งใจสร้างใหม่) → key ใหม่ (attempt ใหม่)", () => {
    const r = resolveRequestKey({ requestKey: "k-1", payload }, { ...payload, card: "CHANGED" }, "new-3");
    expect(r.requestKey).toBe("new-3");
    expect(r.payload.card).toBe("CHANGED");
  });
});
