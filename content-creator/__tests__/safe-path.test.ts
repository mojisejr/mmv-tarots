import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { safeResolveUnderRoot } from "../lib/safe-path";

const TMP = mkdtempSync(join(tmpdir(), "cc-safepath-"));
const root = join(TMP, "root");
mkdirSync(root, { recursive: true });
writeFileSync(join(root, "ok.png"), Buffer.from([1]));
writeFileSync(join(TMP, "outside.png"), Buffer.from([2])); // นอก root
symlinkSync(join(TMP, "outside.png"), join(root, "link.png")); // symlink ใน root ชี้ออกนอก

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("safeResolveUnderRoot [S4a] — DRY path-safety util", () => {
  it("ไฟล์ใน root → คืน real path", () => {
    expect(safeResolveUnderRoot(root, "ok.png")).toBeTruthy();
  });
  it("../ escape → null", () => {
    expect(safeResolveUnderRoot(root, "../outside.png")).toBeNull();
  });
  it("symlink ชี้ออกนอก root → null (ไม่ follow)", () => {
    expect(safeResolveUnderRoot(root, "link.png")).toBeNull();
  });
  it("ไฟล์ไม่มีจริง → null", () => {
    expect(safeResolveUnderRoot(root, "nope.png")).toBeNull();
  });
});
