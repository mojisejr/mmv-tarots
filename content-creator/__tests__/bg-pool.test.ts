import { describe, it, expect } from "vitest";
import { loadManifest, parseManifest, selectEntry, loadEntryBytes, type BgManifestEntry } from "../lib/bg-pool";

const REAL = loadManifest()[0]; // ใช้ entry จริงจาก committed manifest (asset มีจริงในrepo)

describe("bg-pool selectEntry [S6b deterministic]", () => {
  const m: BgManifestEntry[] = [
    { id: "c", file: "c.png", sha256: "a".repeat(64), width: 1, height: 1 },
    { id: "a", file: "a.png", sha256: "a".repeat(64), width: 1, height: 1 },
    { id: "b", file: "b.png", sha256: "a".repeat(64), width: 1, height: 1 },
  ];

  it("manifest ว่าง → throw (pool empty → FAILED)", () => {
    expect(() => selectEntry("seed", [])).toThrow(/ว่าง/);
  });

  it("seed เดิ่ม → ได้ entry เดิมทุกครั้ง (retry/reclaim/preview ตรงกัน)", () => {
    const a = selectEntry("post-123", m);
    const b = selectEntry("post-123", m);
    expect(a.id).toBe(b.id);
  });

  it("ลำดับใน manifest ไม่มีผล (sort by id ก่อนเลือก)", () => {
    const shuffled = [m[2], m[0], m[1]];
    expect(selectEntry("post-xyz", m).id).toBe(selectEntry("post-xyz", shuffled).id);
  });

  it("seed ต่างกันกระจายได้ (ไม่ fix ใบเดียว)", () => {
    const ids = new Set(["s1", "s2", "s3", "s4", "s5", "s6"].map((s) => selectEntry(s, m).id));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe("bg-pool parseManifest unique [ตู๋ P2]", () => {
  const base = { sha256: "a".repeat(64), width: 1, height: 1 };
  it("manifest จริง (committed) โหลดผ่าน (id+file ไม่ซ้ำ)", () => {
    expect(() => loadManifest()).not.toThrow();
  });
  it("id ซ้ำ → throw", () => {
    expect(() => parseManifest([{ id: "x", file: "a.png", ...base }, { id: "x", file: "b.png", ...base }])).toThrow(/id ซ้ำ/);
  });
  it("file ซ้ำ → throw", () => {
    expect(() => parseManifest([{ id: "x", file: "a.png", ...base }, { id: "y", file: "a.png", ...base }])).toThrow(/file ซ้ำ/);
  });
});

describe("bg-pool loadEntryBytes [S6b validate]", () => {
  it("entry จริง (manifest) → คืน PNG bytes", () => {
    const bytes = loadEntryBytes(REAL);
    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47])); // PNG signature
  });

  it("sha256 ไม่ตรง → throw (กัน corrupt/ถูกแก้)", () => {
    expect(() => loadEntryBytes({ ...REAL, sha256: "f".repeat(64) })).toThrow(/sha256/);
  });

  it("dimension ไม่ตรง manifest → throw", () => {
    expect(() => loadEntryBytes({ ...REAL, width: REAL.width + 1 })).toThrow(/dimension/);
  });

  it("ไฟล์ไม่ใช่ .png → throw", () => {
    expect(() => loadEntryBytes({ ...REAL, file: "x.txt" })).toThrow(/\.png/);
  });

  it("ไฟล์ traversal/ไม่พบ → throw (path-safe)", () => {
    expect(() => loadEntryBytes({ ...REAL, file: "../../../etc/passwd.png" })).toThrow(/ไม่พบ|ปลอดภัย/);
  });
});
