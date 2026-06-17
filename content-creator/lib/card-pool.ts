/**
 * tarot card pool [random-cards / PR#103] — แหล่งภาพไพ่จริง (Rider-Waite-Smith, public domain)
 * ที่ composition (next/og) วางทับ AI scene. ดู PROVENANCE.md สำหรับ license.
 *
 * design (mirror bg-pool + ตู๋ guardrails P1):
 *  - source of truth = manifest.json ที่ commit ไว้ (ไม่ scan dir) — แต่ละใบมี sha256 + dimension + ชื่อ
 *  - validate ทุกใบก่อนใช้: safeResolveUnderRoot + non-png reject + sha256 + dimension match
 *  - draw deterministic จาก persisted seed → retry/replay ได้ไพ่ "ชุดเดิม" (ห้าม Math.random) [ตู๋ P1 fence]
 *  - pool ว่าง / mismatch → throw → engine จับเป็น FAILED ก่อนจ่าย paid call (fail-fast)
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { safeResolveUnderRoot } from "./safe-path";

/** dir ที่เก็บ pool + manifest (commit ใน repo) */
export const CARD_POOL_DIR = join(process.cwd(), "content-creator", "assets", "tarot-rws");
const MANIFEST_FILE = "manifest.json";

const CardEntrySchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/, "sha256 ต้องเป็น hex 64 ตัว"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  arcana: z.literal("major"),
  number: z.number().int().min(0).max(21),
  nameEn: z.string().min(1),
  nameTh: z.string().min(1),
});
export type CardManifestEntry = z.infer<typeof CardEntrySchema>;

// unique id + file [ตู๋ P2]: id ซ้ำ → selection กำกวม ; file ซ้ำ → provenance เพี้ยน
const ManifestSchema = z.array(CardEntrySchema).min(1).superRefine((arr, ctx) => {
  if (new Set(arr.map((e) => e.id)).size !== arr.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "card manifest มี id ซ้ำ" });
  if (new Set(arr.map((e) => e.file)).size !== arr.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "card manifest มี file ซ้ำ" });
});

/** parse + validate manifest จาก raw (pure, testable) */
export function parseCardManifest(raw: unknown): CardManifestEntry[] {
  return ManifestSchema.parse(raw);
}

/** อ่าน manifest committed (ไฟล์หาย/ผิด/ซ้ำ → throw : provisioning พัง = ต้องรู้) */
export function loadCardManifest(): CardManifestEntry[] {
  const p = safeResolveUnderRoot(CARD_POOL_DIR, MANIFEST_FILE);
  if (!p) throw new Error(`tarot card manifest ไม่พบ/ไม่ปลอดภัย: ${MANIFEST_FILE}`);
  return parseCardManifest(JSON.parse(readFileSync(p, "utf8")));
}

/** หาไพ่ตาม id (composition โหลดไพ่ที่ persist ไว้) — ไม่อยู่ → throw */
export function selectCardById(id: string, manifest: CardManifestEntry[] = loadCardManifest()): CardManifestEntry {
  const e = manifest.find((x) => x.id === id);
  if (!e) throw new Error(`card id ไม่อยู่ใน manifest: ${id}`);
  return e;
}

/**
 * จั่วไพ่ n ใบ **ไม่ซ้ำ** แบบ deterministic จาก seed (post id / request token) [ตู๋ P1 idempotent draw].
 * seed เดิม + pool เดิม → ได้ไพ่ชุดเดิม "เรียงเดิม" เสมอ → persist cardIds แล้ว replay/retry ไม่สุ่มใหม่.
 * (ห้าม Math.random — golden test จะไม่นิ่ง + replay จะเปลี่ยนไพ่)
 * @throws ถ้า n < 1, n > pool size, หรือ pool ว่าง
 */
export function drawCards(seed: string, n: number, manifest: CardManifestEntry[] = loadCardManifest()): CardManifestEntry[] {
  if (n < 1) throw new Error(`drawCards: n ต้อง >= 1 (ได้ ${n})`);
  if (n > manifest.length) throw new Error(`drawCards: ขอ ${n} ใบ แต่ pool มี ${manifest.length} ใบ`);
  // sort by id ให้ลำดับนิ่งไม่ขึ้นกับลำดับใน manifest (เหมือน bg selectEntry)
  const sorted = [...manifest].sort((a, b) => a.id.localeCompare(b.id));
  const picked: CardManifestEntry[] = [];
  const used = new Set<number>();
  for (let i = 0; picked.length < n; i++) {
    // hash(seed:i) → index ; ชนกับที่จั่วแล้ว → ลอง i ถัดไป (sampling without replacement)
    const idx = createHash("sha256").update(`${seed}:${i}`).digest().readUInt32BE(0) % sorted.length;
    if (!used.has(idx)) {
      used.add(idx);
      picked.push(sorted[idx]);
    }
    if (i > n + manifest.length * 64) throw new Error("drawCards: หา unique ไม่ครบ (ไม่ควรเกิด)"); // guard ลูปไม่จบ
  }
  return picked;
}

/** อ่าน {width,height} จาก PNG IHDR (24 ไบต์แรก) ; ไม่ใช่ PNG → null [เหมือน bg-pool] */
function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || !sig.every((b, i) => bytes[i] === b)) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: dv.getUint32(16), height: dv.getUint32(20) };
}

/**
 * อ่าน bytes ของไพ่ + validate เต็ม (path-safe + .png + sha256 + **dimension ตรง manifest**). ผิด → throw [ตู๋ P1/P2].
 */
export function loadCardBytes(entry: CardManifestEntry): Uint8Array {
  if (!entry.file.toLowerCase().endsWith(".png")) throw new Error(`card ต้องเป็น .png: ${entry.file}`);
  const real = safeResolveUnderRoot(CARD_POOL_DIR, entry.file);
  if (!real) throw new Error(`card ไม่พบ/ไม่ปลอดภัย: ${entry.file}`);
  const bytes = new Uint8Array(readFileSync(real));
  if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256) {
    throw new Error(`card sha256 ไม่ตรง manifest: ${entry.file} (corrupt/ถูกแก้?)`);
  }
  const size = readPngSize(bytes);
  if (!size) throw new Error(`card ไม่ใช่ PNG ที่อ่าน header ได้: ${entry.file}`);
  if (size.width !== entry.width || size.height !== entry.height) {
    throw new Error(`card dimension ไม่ตรง manifest: ${entry.file} (${size.width}x${size.height} ≠ ${entry.width}x${entry.height})`);
  }
  return bytes;
}
