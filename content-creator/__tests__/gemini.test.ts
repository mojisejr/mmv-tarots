import { describe, expect, it, vi, beforeEach } from "vitest";

// mock ai + @ai-sdk/google (ไม่ยิง API จริง — live พิสูจน์แล้วใน POC #1)
const { mockGenerateText, mockGenerateImage } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
  mockGenerateImage: vi.fn(),
}));
vi.mock("ai", () => ({
  generateText: mockGenerateText,
  experimental_generateImage: mockGenerateImage,
}));
vi.mock("@ai-sdk/google", () => ({
  google: Object.assign((id: string) => ({ modelId: id }), { image: (id: string) => ({ imageId: id }) }),
}));

import { genCaption, genImage } from "../lib/gemini";
import { DEFAULT_CAPTION_TEMPERATURE } from "../lib/config";

beforeEach(() => {
  mockGenerateText.mockReset();
  mockGenerateImage.mockReset();
});

describe("genCaption (Gate A)", () => {
  it("คืน text จาก generateText", async () => {
    mockGenerateText.mockResolvedValue({ text: "ปังมากแม่!" });
    const out = await genCaption({ system: "หมอมี่", prompt: "ไพ่ 8 ไม้เท้า" });
    expect(out).toBe("ปังมากแม่!");
  });

  it("ใช้ temperature default เมื่อไม่ระบุ + ส่ง system/prompt", async () => {
    mockGenerateText.mockResolvedValue({ text: "x" });
    await genCaption({ system: "S", prompt: "P" });
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ system: "S", prompt: "P", temperature: DEFAULT_CAPTION_TEMPERATURE }),
    );
  });

  it("ใช้ temperature ที่ override มา", async () => {
    mockGenerateText.mockResolvedValue({ text: "x" });
    await genCaption({ system: "S", prompt: "P", temperature: 0.2 });
    expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.2 }));
  });
});

describe("genImage (Gate A — return bytes)", () => {
  it("คืน Uint8Array จาก generateImage (ไม่ write file)", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    mockGenerateImage.mockResolvedValue({ image: { uint8Array: bytes } });
    const out = await genImage({ prompt: "ไพ่" });
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out)).toEqual([1, 2, 3, 4]);
  });

  it("default aspectRatio = 1:1", async () => {
    mockGenerateImage.mockResolvedValue({ image: { uint8Array: new Uint8Array() } });
    await genImage({ prompt: "ไพ่" });
    expect(mockGenerateImage).toHaveBeenCalledWith(expect.objectContaining({ aspectRatio: "1:1" }));
  });
});
