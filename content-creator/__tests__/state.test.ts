import { describe, expect, it } from "vitest";
import { canTransition, assertTransition, isTerminal } from "../db/state";

describe("content state machine", () => {
  it("เส้นทางหลัก: PENDING→GENERATING→GENERATED→APPROVED→PUBLISHING→POSTED", () => {
    expect(canTransition("PENDING", "GENERATING")).toBe(true); // claim ก่อนเรียก Gemini
    expect(canTransition("GENERATING", "GENERATED")).toBe(true);
    expect(canTransition("GENERATED", "APPROVED")).toBe(true); // human approve gate
    expect(canTransition("APPROVED", "PUBLISHING")).toBe(true); // claim ก่อนยิง FB
    expect(canTransition("PUBLISHING", "POSTED")).toBe(true);
  });

  it("PENDING→GENERATED ตรง ๆ ไม่ได้ (ต้องผ่าน GENERATING claim — กัน gen ซ้ำ)", () => {
    expect(canTransition("PENDING", "GENERATED")).toBe(false);
  });

  it("GENERATING recovery: → FAILED / → PENDING (คืน claim)", () => {
    expect(canTransition("GENERATING", "FAILED")).toBe(true);
    expect(canTransition("GENERATING", "PENDING")).toBe(true);
  });

  it("APPROVED→POSTED ตรง ๆ ไม่ได้ (ต้องผ่าน PUBLISHING claim — กัน FB โพสต์ซ้ำ)", () => {
    expect(canTransition("APPROVED", "POSTED")).toBe(false);
  });

  it("PUBLISHING recovery: → FAILED / → APPROVED (คืน claim)", () => {
    expect(canTransition("PUBLISHING", "FAILED")).toBe(true);
    expect(canTransition("PUBLISHING", "APPROVED")).toBe(true);
  });

  it("ข้ามขั้นไม่ได้: PENDING→APPROVED / PENDING→POSTED", () => {
    expect(canTransition("PENDING", "APPROVED")).toBe(false);
    expect(canTransition("PENDING", "POSTED")).toBe(false);
  });

  it("terminal: POSTED/CANCELED ไปไหนไม่ได้", () => {
    expect(canTransition("POSTED", "PENDING")).toBe(false);
    expect(canTransition("CANCELED", "PENDING")).toBe(false);
    expect(isTerminal("POSTED")).toBe(true);
    expect(isTerminal("CANCELED")).toBe(true);
    expect(isTerminal("PUBLISHING")).toBe(false);
  });

  it("cancel ได้จาก active state (ก่อน PUBLISHING)", () => {
    expect(canTransition("PENDING", "CANCELED")).toBe(true);
    expect(canTransition("GENERATED", "CANCELED")).toBe(true);
    expect(canTransition("APPROVED", "CANCELED")).toBe(true);
  });

  it("FAILED → PENDING (retry) ได้", () => {
    expect(canTransition("FAILED", "PENDING")).toBe(true);
  });

  it("assertTransition throw เมื่อ invalid", () => {
    expect(() => assertTransition("APPROVED", "POSTED")).toThrow(/invalid content status transition/);
    expect(() => assertTransition("PENDING", "PUBLISHING")).toThrow();
  });
});
