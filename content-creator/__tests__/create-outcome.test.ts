import { describe, it, expect } from "vitest";
import { classifyCreateResponse, shouldClearPending } from "../lib/create-outcome";

describe("classifyCreateResponse + shouldClearPending — definitive lifecycle [ตู๋ P1]", () => {
  it("200 GENERATED definitive → success → clear", () => {
    const o = classifyCreateResponse(200, { definitive: true, ok: true });
    expect(o).toBe("success");
    expect(shouldClearPending(o)).toBe(true);
  });

  // scenario ที่ ตู๋ ชี้: 502 แรกหาย → retry ได้ 200 FAILED (definitive) → ต้อง clear (ไม่ค้าง stuck FAILED)
  it("200 FAILED definitive (lost-response retry) → failed → clear → retry = attempt ใหม่", () => {
    const o = classifyCreateResponse(200, { definitive: true, ok: false });
    expect(o).toBe("failed");
    expect(shouldClearPending(o)).toBe(true);
  });

  it("502 FAILED definitive → failed → clear", () => {
    const o = classifyCreateResponse(502, { definitive: true, ok: false });
    expect(o).toBe("failed");
    expect(shouldClearPending(o)).toBe(true);
  });

  it("202 in-progress → ไม่ clear (เก็บ key)", () => {
    const o = classifyCreateResponse(202, { inProgress: true });
    expect(o).toBe("in-progress");
    expect(shouldClearPending(o)).toBe(false);
  });

  it("500/409/ผลไม่ชัด (ไม่มี definitive) → unknown → ไม่ clear", () => {
    expect(shouldClearPending(classifyCreateResponse(500, {}))).toBe(false);
    expect(shouldClearPending(classifyCreateResponse(409, { ok: false }))).toBe(false);
  });
});
