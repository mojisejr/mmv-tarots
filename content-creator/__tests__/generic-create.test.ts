import { describe, it, expect } from "vitest";
import {
  parseSession,
  resolveGenericSession,
  classifyGenericResponse,
  shouldClearSession,
  mountAction,
} from "../lib/generic-create";

describe("parseSession [too P2.1 corrupt guard]", () => {
  it("valid → object", () => {
    expect(parseSession(JSON.stringify({ requestKey: "k", type: "yes-no", draftId: "d" }))).toEqual({ requestKey: "k", type: "yes-no", draftId: "d" });
  });
  it("corrupt JSON → null", () => {
    expect(parseSession("{not json")).toBeNull();
  });
  it("ขาด field → null", () => {
    expect(parseSession(JSON.stringify({ requestKey: "k" }))).toBeNull();
    expect(parseSession(null)).toBeNull();
  });
});

describe("resolveGenericSession [idempotency key]", () => {
  it("type เดิม → reuse key เดิม (retry idempotent)", () => {
    const prev = { requestKey: "k1", type: "yes-no" };
    expect(resolveGenericSession(prev, "yes-no", "k2")).toEqual(prev);
  });
  it("type เปลี่ยน → key ใหม่", () => {
    const prev = { requestKey: "k1", type: "yes-no" };
    expect(resolveGenericSession(prev, "ดวงรัก", "k2")).toEqual({ requestKey: "k2", type: "ดวงรัก" });
  });
  it("ไม่มี session → key ใหม่", () => {
    expect(resolveGenericSession(null, "x", "k2")).toEqual({ requestKey: "k2", type: "x" });
  });
});

describe("classifyGenericResponse [§1.1 outcomes]", () => {
  it("stale → stale (เริ่มใหม่)", () => {
    expect(classifyGenericResponse(202, { stale: true, inProgress: true })).toBe("stale");
  });
  it("202 / inProgress → in-progress", () => {
    expect(classifyGenericResponse(202, { inProgress: true })).toBe("in-progress");
    expect(classifyGenericResponse(200, { inProgress: true })).toBe("in-progress");
  });
  it("definitive ok → success ; definitive !ok → failed", () => {
    expect(classifyGenericResponse(200, { definitive: true, ok: true })).toBe("success");
    expect(classifyGenericResponse(502, { definitive: true, ok: false })).toBe("failed");
  });
  it("400/409/network → unknown (เก็บ key)", () => {
    expect(classifyGenericResponse(409, {})).toBe("unknown");
    expect(classifyGenericResponse(500, {})).toBe("unknown");
  });
});

describe("shouldClearSession", () => {
  it("clear เมื่อ terminal/stale ; เก็บเมื่อ in-progress/unknown", () => {
    expect(shouldClearSession("success")).toBe(true);
    expect(shouldClearSession("failed")).toBe(true);
    expect(shouldClearSession("stale")).toBe(true);
    expect(shouldClearSession("in-progress")).toBe(false);
    expect(shouldClearSession("unknown")).toBe(false);
  });
});

describe("mountAction [resume on reload]", () => {
  it("มี session → resume (POST key+type เดิม) ; ไม่มี → none", () => {
    expect(mountAction({ requestKey: "k", type: "yes-no" })).toEqual({ kind: "resume", requestKey: "k", type: "yes-no" });
    expect(mountAction(null)).toEqual({ kind: "none" });
  });
});
