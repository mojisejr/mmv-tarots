import { describe, it, expect, afterEach } from "vitest";
import { isContentCreatorEnabled } from "../lib/enabled";

const SAVED = {
  enabled: process.env.CONTENT_CREATOR_ENABLED,
  vercel: process.env.VERCEL,
};
function setEnv(enabled?: string, vercel?: string) {
  if (enabled === undefined) delete process.env.CONTENT_CREATOR_ENABLED;
  else process.env.CONTENT_CREATOR_ENABLED = enabled;
  if (vercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = vercel;
}
afterEach(() => setEnv(SAVED.enabled, SAVED.vercel));

describe("isContentCreatorEnabled — fail-closed gate [S3]", () => {
  it("default (ไม่ set อะไร) → false (ปิดเป็น default)", () => {
    setEnv(undefined, undefined);
    expect(isContentCreatorEnabled()).toBe(false);
  });

  it("CONTENT_CREATOR_ENABLED=true + local → true", () => {
    setEnv("true", undefined);
    expect(isContentCreatorEnabled()).toBe(true);
  });

  it("บน Vercel → false เสมอ แม้ตั้ง enabled=true (hard off กัน expose)", () => {
    setEnv("true", "1");
    expect(isContentCreatorEnabled()).toBe(false);
  });

  it("ค่าที่ไม่ใช่ 'true' เป๊ะ ๆ → false (เช่น '1', 'yes')", () => {
    setEnv("1", undefined);
    expect(isContentCreatorEnabled()).toBe(false);
    setEnv("yes", undefined);
    expect(isContentCreatorEnabled()).toBe(false);
  });
});
