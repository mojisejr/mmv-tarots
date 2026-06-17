import { describe, it, expect } from "vitest";
import { loadCardManifest, parseCardManifest, drawCards, selectCardById, loadCardBytes } from "../lib/card-pool";

describe("card-pool — manifest validation [PR#103 ตู๋ P1]", () => {
  it("manifest committed = 22 Major Arcana, dims + sha256 ครบ", () => {
    const m = loadCardManifest();
    expect(m).toHaveLength(22);
    expect(m.every((c) => c.arcana === "major" && c.width > 0 && c.height > 0 && /^[a-f0-9]{64}$/.test(c.sha256))).toBe(true);
    expect(m.map((c) => c.number).sort((a, b) => a - b)).toEqual([...Array(22).keys()]);
  });

  it("reject manifest id ซ้ำ / file ซ้ำ", () => {
    const base = { sha256: "a".repeat(64), width: 357, height: 600, arcana: "major", number: 0, nameEn: "X", nameTh: "x" };
    expect(() => parseCardManifest([{ ...base, id: "a", file: "a.png" }, { ...base, id: "a", file: "b.png" }])).toThrow(/id ซ้ำ/);
    expect(() => parseCardManifest([{ ...base, id: "a", file: "x.png" }, { ...base, id: "b", file: "x.png" }])).toThrow(/file ซ้ำ/);
  });
});

describe("card-pool — drawCards deterministic/idempotent [ตู๋ P1 fence]", () => {
  it("seed เดิม → ไพ่ชุดเดิม เรียงเดิม (replay ไม่สุ่มใหม่)", () => {
    const a = drawCards("post-123", 3).map((c) => c.id);
    const b = drawCards("post-123", 3).map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
  });

  it("3 ใบ unique เสมอ (ไม่ซ้ำใน draw เดียว)", () => {
    for (const seed of ["s1", "s2", "deadbeef", "ฟีม", "2026-06-17"]) {
      const ids = drawCards(seed, 3).map((c) => c.id);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it("seed ต่าง → ชุดต่าง (โดยทั่วไป) + จั่วได้ครบ pool (22)", () => {
    expect(drawCards("x", 3)).not.toEqual(drawCards("y", 3));
    expect(drawCards("all", 22).map((c) => c.id).sort()).toEqual(loadCardManifest().map((c) => c.id).sort());
  });

  it("n > pool / n < 1 → throw", () => {
    expect(() => drawCards("s", 23)).toThrow(/pool มี 22/);
    expect(() => drawCards("s", 0)).toThrow(/n ต้อง/);
  });
});

describe("card-pool — load bytes + by id", () => {
  it("selectCardById + loadCardBytes (sha256 ตรง) ของไพ่ที่จั่ว", () => {
    const drawn = drawCards("post-xyz", 3);
    for (const c of drawn) {
      const e = selectCardById(c.id);
      expect(e.id).toBe(c.id);
      expect(loadCardBytes(e).length).toBeGreaterThan(1000); // อ่าน + validate sha256 ผ่าน
    }
  });

  it("selectCardById id มั่ว → throw", () => {
    expect(() => selectCardById("major-99")).toThrow(/ไม่อยู่ใน manifest/);
  });
});
