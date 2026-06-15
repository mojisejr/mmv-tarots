import { describe, it, expect } from "vitest";
import { parseSession, freshSession, reduceDraft, mountAction, regenAttemptKey, createButtonMode, type Session, type DraftView } from "../lib/daily7-session";

const S: Session = { requestKey: "rk", targetDate: "2026-06-15", finalizeKey: "fk" };

describe("parseSession guard [ตู๋ P2]", () => {
  it("valid → object", () => {
    expect(parseSession(JSON.stringify(S))?.requestKey).toBe("rk");
  });
  it("null / corrupt JSON / ขาด field → null (ไม่ throw)", () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession("{not json")).toBeNull();
    expect(parseSession(JSON.stringify({ requestKey: "x" }))).toBeNull(); // ขาด targetDate/finalizeKey
  });
  it("draftId/pendingAttemptKey optional restore", () => {
    const s = parseSession(JSON.stringify({ ...S, draftId: "d1", pendingAttemptKey: "a1" }));
    expect(s?.draftId).toBe("d1");
    expect(s?.pendingAttemptKey).toBe("a1");
  });
});

describe("mountAction recovery [ตู๋ P1 lost-response]", () => {
  it("ไม่มี session → none", () => expect(mountAction(null).kind).toBe("none"));
  it("มี draftId → restore (GET)", () => {
    const a = mountAction({ ...S, draftId: "d1" });
    expect(a).toEqual({ kind: "restore", draftId: "d1" });
  });
  it("requestKey แต่ไม่มี draftId (create response หาย) → resume (POST key เดิม ไม่ใช่ key ใหม่)", () => {
    const a = mountAction(S);
    expect(a).toEqual({ kind: "resume", requestKey: "rk", targetDate: "2026-06-15" });
  });
});

describe("reduceDraft [ตู๋ P1 finalize-restore]", () => {
  const base: DraftView = { id: "d1", revision: 2, status: "READY", draftData: { days: [{ day: "จันทร์", fortune: "x" }] } };
  it("READY → keep session + draftId, postId null", () => {
    const r = reduceDraft(base, S);
    expect(r.status).toBe("READY");
    expect(r.session?.draftId).toBe("d1");
    expect(r.postId).toBeNull();
  });
  it("FINALIZED → อ่าน contentPostId + clear session (กัน finalize-response หายแล้วค้าง)", () => {
    const r = reduceDraft({ ...base, status: "FINALIZED", contentPostId: "post-9" }, { ...S, draftId: "d1" });
    expect(r.postId).toBe("post-9");
    expect(r.session).toBeNull();
  });
  it("GENERATING → keep session (รอ/reclaim)", () => {
    expect(reduceDraft({ ...base, status: "GENERATING" }, S).session?.draftId).toBe("d1");
  });
});

describe("createButtonMode same-mount retry [ตู๋ P1]", () => {
  it("ไม่มี session → new", () => expect(createButtonMode(null)).toBe("new"));
  it("pending create (response หาย, ยังไม่ reload) → resume (ไม่ใช่ new ที่จะ overwrite key)", () => {
    expect(createButtonMode(S)).toBe("resume");
  });
  it("มี draftId → restart (intentional)", () => {
    expect(createButtonMode({ ...S, draftId: "d1" })).toBe("restart");
  });
  it("sequence: create fail (persist pending) → ปุ่มถัดไป resume key เดิม (ไม่ gen ซ้ำ)", () => {
    let n = 0;
    const s = freshSession("2026-06-15", () => `k${n++}`); // requestKey=k0
    // create POST ล้ม/response หาย → session ยัง persist (ไม่มี draftId)
    expect(createButtonMode(s)).toBe("resume");
    // resume ใช้ requestKey เดิม
    expect(mountAction(s)).toEqual({ kind: "resume", requestKey: "k0", targetDate: "2026-06-15" });
  });
});

describe("regenAttemptKey / freshSession", () => {
  it("pendingAttemptKey มี → reuse (retry response หาย → backend replay)", () => {
    expect(regenAttemptKey({ ...S, pendingAttemptKey: "a1" }, () => "NEW")).toBe("a1");
  });
  it("ไม่มี pending → key ใหม่", () => {
    expect(regenAttemptKey(S, () => "NEW")).toBe("NEW");
  });
  it("freshSession → requestKey+finalizeKey ใหม่", () => {
    let n = 0;
    const s = freshSession("2026-06-15", () => `k${n++}`);
    expect(s.requestKey).toBe("k0");
    expect(s.finalizeKey).toBe("k1");
    expect(s.draftId).toBeUndefined();
  });
});
