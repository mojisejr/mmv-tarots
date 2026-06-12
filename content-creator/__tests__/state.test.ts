import { describe, expect, it } from "vitest";
import { canTransition, assertTransition, isTerminal } from "../db/state";

describe("content state machine", () => {
  it("เส้นทางหลัก: PENDING→GENERATED→APPROVED→POSTED", () => {
    expect(canTransition("PENDING", "GENERATED")).toBe(true);
    expect(canTransition("GENERATED", "APPROVED")).toBe(true); // human approve gate
    expect(canTransition("APPROVED", "POSTED")).toBe(true);
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
    expect(isTerminal("PENDING")).toBe(false);
  });

  it("cancel ได้จากทุก active state", () => {
    expect(canTransition("PENDING", "CANCELED")).toBe(true);
    expect(canTransition("GENERATED", "CANCELED")).toBe(true);
    expect(canTransition("APPROVED", "CANCELED")).toBe(true);
  });

  it("FAILED → PENDING (retry) ได้", () => {
    expect(canTransition("APPROVED", "FAILED")).toBe(true);
    expect(canTransition("FAILED", "PENDING")).toBe(true);
  });

  it("assertTransition throw เมื่อ invalid", () => {
    expect(() => assertTransition("PENDING", "POSTED")).toThrow(/invalid content status transition/);
    expect(() => assertTransition("APPROVED", "GENERATED")).toThrow();
  });
});
