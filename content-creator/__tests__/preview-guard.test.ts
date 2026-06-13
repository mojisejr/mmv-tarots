import { describe, it, expect } from "vitest";
import { PreviewGuard } from "../lib/preview-guard";

describe("PreviewGuard — stale/out-of-order preview [ตู๋ P2]", () => {
  it("accept token ของ request ปัจจุบัน", () => {
    const g = new PreviewGuard();
    expect(g.accepts(g.begin())).toBe(true);
  });

  // scenario ที่ ตู๋ ชี้: A ค้าง → input เปลี่ยน (invalidate) → A กลับมา "ก่อน" กด preview ใหม่ → ต้องทิ้ง
  it("invalidate (input เปลี่ยน) → request ที่ค้างถูกทิ้งแม้กลับมาก่อน request ใหม่", () => {
    const g = new PreviewGuard();
    const tA = g.begin();
    g.invalidate();
    expect(g.accepts(tA)).toBe(false);
  });

  it("out-of-order: A ก่อน B → A กลับมาทีหลังถูกทิ้ง, B ผ่าน", () => {
    const g = new PreviewGuard();
    const tA = g.begin();
    const tB = g.begin();
    expect(g.accepts(tA)).toBe(false);
    expect(g.accepts(tB)).toBe(true);
  });
});
