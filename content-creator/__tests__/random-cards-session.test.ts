import { describe, it, expect } from "vitest";
import { parseSession, freshSession, reduceDraft, mountAction, restoreAction, regenAttemptKey, createButtonMode, reduceFinalize, type Session } from "../lib/random-cards-session";

let n = 0;
const gen = () => `k${n++}`;
const base = (): Session => ({ requestKey: "rk", finalizeKey: "fk" });

describe("random-cards-session reducer [PR#103 ตู๋ P1.1]", () => {
  it("parseSession: ต้องมี requestKey+finalizeKey ; corrupt/ขาด → null", () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession("{bad")).toBeNull();
    expect(parseSession(JSON.stringify({ requestKey: "a" }))).toBeNull(); // ขาด finalizeKey
    expect(parseSession(JSON.stringify({ requestKey: "a", finalizeKey: "b", draftId: "d" }))).toEqual({ requestKey: "a", finalizeKey: "b", draftId: "d" });
  });

  it("freshSession → requestKey+finalizeKey (key คนละตัว)", () => {
    const s = freshSession(gen);
    expect(s.requestKey).toBeTruthy();
    expect(s.finalizeKey).toBeTruthy();
    expect(s.requestKey).not.toBe(s.finalizeKey);
  });

  it("mountAction: ไม่มี session→none ; มี draftId→restore ; ยังไม่มี draftId→resume (key เดิม)", () => {
    expect(mountAction(null)).toEqual({ kind: "none" });
    expect(mountAction(base())).toEqual({ kind: "resume", requestKey: "rk" });
    expect(mountAction({ ...base(), draftId: "d1" })).toEqual({ kind: "restore", draftId: "d1" });
  });

  it("createButtonMode: none→new ; ยังไม่มี draftId→resume (ไม่จ่ายซ้ำ) ; มี draftId→restart", () => {
    expect(createButtonMode(null)).toBe("new");
    expect(createButtonMode(base())).toBe("resume");
    expect(createButtonMode({ ...base(), draftId: "d" })).toBe("restart");
  });

  it("regenAttemptKey: reuse pendingAttemptKey ถ้ามี (retry replay) ; ไม่มี→key ใหม่", () => {
    expect(regenAttemptKey({ ...base(), pendingAttemptKey: "ak1" }, gen)).toBe("ak1");
    expect(regenAttemptKey(base(), () => "new-ak")).toBe("new-ak");
  });

  it("reduceDraft: READY → set draftId + data ; FINALIZED → KEEP session (finalizeKey ไว้ replay) [ตู๋ reload]", () => {
    const ready = reduceDraft({ id: "d1", revision: 0, status: "READY", draftData: { cardIds: ["major-00", "major-01", "major-02"], quote: "q", body: "b" } }, base());
    expect(ready.status).toBe("READY");
    expect(ready.data?.cardIds).toHaveLength(3);
    expect(ready.session?.draftId).toBe("d1");

    const fin = reduceDraft({ id: "d1", revision: 1, status: "FINALIZED", contentPostId: "p1" }, { ...base(), draftId: "d1" });
    expect(fin.status).toBe("FINALIZED");
    expect(fin.session?.finalizeKey).toBe("fk"); // **keep** (ไม่ clear) → มี finalizeKey ไว้ replay
    expect(fin.postId).toBe("p1");
  });

  it("[ตู๋ P1 reload] restoreAction: FINALIZED → replay-finalize(revision) ; READY → show-draft", () => {
    expect(restoreAction({ id: "d", revision: 3, status: "FINALIZED", contentPostId: "p" })).toEqual({ kind: "replay-finalize", revision: 3 });
    expect(restoreAction({ id: "d", revision: 0, status: "READY" })).toEqual({ kind: "show-draft" });
    expect(restoreAction({ id: "d", revision: 0, status: "GENERATING" })).toEqual({ kind: "show-draft" });
  });

  it("[ตู๋ P1 reload] lost finalize→reload→replay → classify contentPost จริง: GENERATED→queue / GENERATING(PENDING)→processing / FAILED→failed", () => {
    // replay finalize route คืน classifyFinalizeStatus(status จริง) → reduceFinalize:
    expect(reduceFinalize({ ok: true, definitive: true, status: "GENERATED" })).toEqual({ kind: "queue" }); // gen เสร็จแล้ว → ไปคิว
    expect(reduceFinalize({ ok: false, definitive: false, status: "GENERATING" }).kind).toBe("processing"); // ยัง gen → lock keep session
    expect(reduceFinalize({ ok: false, definitive: false, status: "PENDING" }).kind).toBe("processing");
    expect(reduceFinalize({ ok: false, definitive: true, status: "FAILED", error: "x" }).kind).toBe("failed"); // ล้ม → reset
  });
});
