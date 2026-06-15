/**
 * daily-7 background pool [S6b] — แหล่งภาพพื้นหลังของ composition (next/og วาง text ทับ)
 *
 * design (ตู๋ guardrails):
 *  - source of truth = manifest.json ที่ "commit ไว้" (ไม่ scan dir) — แต่ละ entry มี sha256 + dimension
 *  - render path = no Gemini/no paid call: แค่ "อ่านไฟล์จาก pool + validate" (provisioning แยก lifecycle)
 *  - selection deterministic จาก persisted seed (post id) → retry/reclaim/preview ได้ bg เดิม
 *    (ห้าม Math.random — golden test จะไม่นิ่ง)
 *  - validate ทุกใบก่อนใช้: safeResolveUnderRoot + non-png reject + sha256 + dimension match
 *  - pool ว่าง / mismatch → throw → engine จับเป็น FAILED ก่อนจ่าย caption (fail-fast)
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { safeResolveUnderRoot } from "./safe-path";

/** dir ที่เก็บ pool + manifest (commit ใน repo — force-traced เข้า lambda ผ่าน next.config) */
export const BG_POOL_DIR = join(process.cwd(), "content-creator", "assets", "daily-7-bg");
const MANIFEST_FILE = "manifest.json";

const ManifestEntrySchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/, "sha256 ต้องเป็น hex 64 ตัว"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type BgManifestEntry = z.infer<typeof ManifestEntrySchema>;

const ManifestSchema = z.array(ManifestEntrySchema);

/** อ่าน + parse manifest (committed). ไฟล์หาย/รูปแบบผิด → throw (provisioning พัง = ต้องรู้) */
export function loadManifest(): BgManifestEntry[] {
  const manifestPath = safeResolveUnderRoot(BG_POOL_DIR, MANIFEST_FILE);
  if (!manifestPath) throw new Error(`daily-7 bg manifest ไม่พบ/ไม่ปลอดภัย: ${MANIFEST_FILE}`);
  const raw = JSON.parse(readFileSync(manifestPath, "utf8"));
  return ManifestSchema.parse(raw);
}

/**
 * เลือก entry แบบ deterministic จาก seed (post id) — sort by id ให้ลำดับนิ่งไม่ขึ้นกับลำดับใน manifest
 * แล้ว hash(seed) % len. seed เดิม + pool เดิม → ได้ใบเดิมเสมอ (retry/reclaim/preview ตรงกัน).
 * @throws ถ้า manifest ว่าง (ไม่มี bg ให้เลือก → FAILED ก่อนจ่าย caption)
 */
export function selectEntry(seed: string, manifest: BgManifestEntry[]): BgManifestEntry {
  if (manifest.length === 0) throw new Error("daily-7 bg pool ว่าง (manifest ไม่มี entry) — seed pool ก่อน gen");
  const sorted = [...manifest].sort((a, b) => a.id.localeCompare(b.id));
  const digest = createHash("sha256").update(seed).digest();
  const idx = digest.readUInt32BE(0) % sorted.length;
  return sorted[idx];
}

/** อ่าน 24 ไบต์แรกของ PNG → {width,height} จาก IHDR (ไม่ต้องพึ่ง lib ภายนอก) ; ไม่ใช่ PNG → null */
function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG signature 8 bytes + IHDR: length(4)+type(4)+width(4)+height(4) → width @16, height @20 (big-endian)
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || !sig.every((b, i) => bytes[i] === b)) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: dv.getUint32(16), height: dv.getUint32(20) };
}

/**
 * โหลด bytes ของ entry แบบ validate เต็ม (ตู๋: ห้ามเชื่อ manifest ลอย ๆ):
 *  path-safe (symlink/traversal) + .png + sha256 ตรง + dimension ตรง manifest. ผิดข้อใด → throw.
 */
export function loadEntryBytes(entry: BgManifestEntry): Uint8Array {
  if (!entry.file.toLowerCase().endsWith(".png")) throw new Error(`bg ต้องเป็น .png: ${entry.file}`);
  const real = safeResolveUnderRoot(BG_POOL_DIR, entry.file);
  if (!real) throw new Error(`bg ไม่พบ/ไม่ปลอดภัย (symlink/traversal?): ${entry.file}`);
  const bytes = new Uint8Array(readFileSync(real));

  const actualSha = createHash("sha256").update(bytes).digest("hex");
  if (actualSha !== entry.sha256) throw new Error(`bg sha256 ไม่ตรง manifest: ${entry.file} (corrupt/ถูกแก้?)`);

  const size = readPngSize(bytes);
  if (!size) throw new Error(`bg ไม่ใช่ PNG ที่อ่าน header ได้: ${entry.file}`);
  if (size.width !== entry.width || size.height !== entry.height) {
    throw new Error(`bg dimension ไม่ตรง manifest: ${entry.file} (${size.width}x${size.height} ≠ ${entry.width}x${entry.height})`);
  }
  return bytes;
}

/** เลือก + โหลด bg สำหรับ seed (post id) ในก้าวเดียว — ใช้โดย renderImage */
export function loadBackgroundForSeed(seed: string): { entry: BgManifestEntry; bytes: Uint8Array } {
  const entry = selectEntry(seed, loadManifest());
  return { entry, bytes: loadEntryBytes(entry) };
}
