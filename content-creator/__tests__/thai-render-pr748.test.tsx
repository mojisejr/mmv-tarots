import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderOgImage } from "../lib/render-og";

const OUT_W = 1400;
const OUT_H = 560;
const FONT_PATH = join(process.cwd(), "assets", "fonts", "NotoSansThai-Bold.ttf");
const WORDS = [
  "ที่",
  "ปี่",
  "พี่",
  "มื้อ",
  "ฟื้น",
  "ปลื้ม",
  "ซื้อ",
  "ดื่ม",
  "ชี้",
  "หนี้",
  "ลิ้น",
  "เยิ้ม",
  "ลิ้น",
  "เยิ้ม",
  "ปั้น",
  "ช่วย",
  "ใช่",
  "ห้าม",
  "ก่อน",
  "ผู้",
  "เก้า",
  "น้ำ",
];

function loadFont(): ArrayBuffer {
  return new Uint8Array(readFileSync(FONT_PATH)).buffer;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("Thai render regression [Satori PR #748 vendor patch]", () => {
  it("renders torture words through the production Satori+resvg path", async () => {
    const bytes = await renderOgImage(
      (
        <div style={{ width: OUT_W, height: OUT_H, display: "flex", flexDirection: "column", backgroundColor: "#fffaf7", fontFamily: "Noto Sans Thai", padding: 48 }}>
          <div style={{ display: "flex", color: "#3b2342", fontSize: 34, fontWeight: 700, marginBottom: 28 }}>Thai tone-mark torture fixture</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            {WORDS.map((word, i) => (
              <div key={`${word}-${i}`} style={{ display: "flex", width: 138, height: 82, alignItems: "center", justifyContent: "center", backgroundColor: "#f4e7ef", border: "2px solid #9b6b8f", borderRadius: 12 }}>
                <span style={{ color: "#201623", fontSize: 46, fontWeight: 700, lineHeight: 1.2 }}>{word}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      { width: OUT_W, height: OUT_H, fonts: [{ name: "Noto Sans Thai", data: loadFont(), style: "normal", weight: 700 }] },
    );

    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dv.getUint32(16)).toBe(OUT_W);
    expect(dv.getUint32(20)).toBe(OUT_H);
    writeFileSync("/tmp/thai-render-pr748-fixture.png", bytes);
    expect(sha256(bytes)).toBe("27c00c0f5afc4bf5dcb86d21650022ca802fb38d8c2a64fcd279bab4c435f02f");
  }, 30000);
});
