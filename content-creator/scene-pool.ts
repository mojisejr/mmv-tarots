/**
 * scene library [PR#105 D2/D6] — gen AI scene (แมว Mimi) ล่วงหน้าเป็น batch → ฟีม approve ด้วยตา
 * → random-cards สุ่มใช้จาก APPROVED (human gate กันแมวหาย/crop 100%). ไม่ fallback (fail loud).
 *
 * status machine: PENDING ─approve→ APPROVED ─retire→ RETIRED | PENDING ─reject→ REJECTED (เก็บไฟล์ทั้งหมด — Nothing is Deleted)
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq, sql } from "drizzle-orm";
import type { ContentDb } from "./db/client";
import { sceneLibrary, type SceneRow } from "./db/schema";
import { getBrandProfile } from "./db/brand";
import { genImageWithRef } from "./lib/gemini";
import { safeResolveUnderRoot } from "./lib/safe-path";

export const SCENES_DIR = "content-creator/brand/scenes"; // relative (commit .gitkeep ; .png runtime gitignored)

/** anti-ฟีนิกซ์ + cat-only (tighten ตาม ก้อน 2: แมว subject เดียว ห้ามคน) */
const SCENE_DIRECTIVE =
  "ใช้ตัวละคร 'แมว' จากภาพอ้างอิงให้เหมือนเป๊ะ — เป็นแมวตัวเดียวกัน (สี/หน้าตา/ผ้าโพกหัว/เครื่องประดับตรงกันทุกจุด) เป็น subject เดียวของภาพ. " +
  "**ห้ามมีคน/มนุษย์/มือคนในภาพ ห้ามเปลี่ยนเป็นสัตว์อื่น (ห้ามนก/ฟีนิกซ์)**. ";
const SCENE_NO_TEXT = "ห้ามมีตัวอักษร ข้อความ ไพ่ทาโรต์ หรือลายน้ำใด ๆ บนภาพ (no text/letters/cards/watermark).";

/** ธีมฉากหลากหลาย (gen variety) — แมวในบรรยากาศ tarot ต่างๆ */
const SCENE_THEMES = [
  "เช้าอบอุ่นแสงนุ่ม", "ค่ำคืนใต้แสงดาว", "สวนดอกไม้พาสเทล", "ห้องคริสตัลเรืองแสง",
  "โต๊ะไม้มีเทียนหลายเล่ม", "ม่านลูกไม้ชมพู", "ควันธูปลอยอ้อยอิ่ง", "ดอกไม้แห้งสีพีช",
  "แสงทองยามเย็น", "ลูกแก้วพยากรณ์", "ผลึกหินสีม่วง", "บรรยากาศมินิมอลโทนครีม",
];

/** prompt 1 scene — แมวในบรรยากาศ tarot (no person/text/cards) + ธีม + เว้นที่กลาง-ล่างสำหรับ composition */
function buildScenePrompt(theme: string): string {
  return (
    `${SCENE_DIRECTIVE}สร้างฉากโต๊ะดูดวงทาโรต์ บรรยากาศ cozy mystic ธีม: ${theme}. ` +
    "โทนพีช-ชมพู-ลาเวนเดอร์ นุ่มนวล digital illustration soft painterly สวยงาม. " +
    "วางแมวมุมบน (ขนาดพอเห็นชัดเป็นแบรนด์ ไม่ล้ำลงกลาง/ล่าง). ครึ่งกลาง-ล่างเป็นพื้นโต๊ะโล่งเรียบ. " +
    `ภาพจัตุรัส 1:1. ${SCENE_NO_TEXT}`
  );
}

function persistScene(id: string, bytes: Uint8Array): string {
  mkdirSync(SCENES_DIR, { recursive: true });
  const rel = `${SCENES_DIR}/${id}.png`;
  writeFileSync(rel, bytes);
  return rel;
}

export interface GenBatchResult { batch: string; count: number; ids: string[] }

/**
 * gen N scenes (default 12) → save + insert PENDING row (genBatch เดียวกัน). fail loud (ไม่ skip/fallback).
 * ใช้ aspectRatio 1:1 (กัน crop) + ref แมว. ต้องมี brand.refImagePath ไม่งั้น throw.
 */
export async function genSceneBatch(db: ContentDb, count = 12): Promise<GenBatchResult> {
  const brand = getBrandProfile(db);
  if (!brand.refImagePath) throw new Error("scene batch: ต้องตั้ง brand ref image (refImagePath) ก่อน");
  const refReal = safeResolveUnderRoot(process.cwd(), brand.refImagePath);
  if (!refReal) throw new Error(`scene batch: brand ref ไม่พบ/ไม่ปลอดภัย: ${brand.refImagePath}`);
  const refImage = new Uint8Array(readFileSync(refReal));

  const batch = `batch-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const theme = SCENE_THEMES[i % SCENE_THEMES.length];
    const bytes = await genImageWithRef({ prompt: buildScenePrompt(theme), refImage, aspectRatio: "1:1", model: brand.imageModel ?? undefined });
    const id = crypto.randomUUID();
    const imagePath = persistScene(id, bytes);
    db.insert(sceneLibrary).values({ id, theme, imagePath, status: "PENDING", genBatch: batch }).run();
    ids.push(id);
  }
  return { batch, count: ids.length, ids };
}

/** atomic transition — คืน true ถ้าเปลี่ยนสำเร็จ (false = row ไม่อยู่ state ที่คาด → stale/ผิดทาง) */
function transition(db: ContentDb, id: string, from: SceneRow["status"], to: SceneRow["status"], patch: Partial<SceneRow> = {}): boolean {
  const res = db.update(sceneLibrary).set({ status: to, ...patch }).where(and(eq(sceneLibrary.id, id), eq(sceneLibrary.status, from))).run();
  return res.changes === 1;
}

export const approveScene = (db: ContentDb, id: string) => transition(db, id, "PENDING", "APPROVED", { approvedAt: new Date() });
export const rejectScene = (db: ContentDb, id: string) => transition(db, id, "PENDING", "REJECTED");
export const retireScene = (db: ContentDb, id: string) => transition(db, id, "APPROVED", "RETIRED", { retiredAt: new Date() });

/** list scenes ตาม status (gallery) */
export function listScenes(db: ContentDb, status?: SceneRow["status"]): SceneRow[] {
  const q = db.select().from(sceneLibrary);
  return (status ? q.where(eq(sceneLibrary.status, status)) : q).all();
}
export function countApproved(db: ContentDb): number {
  return db.select({ id: sceneLibrary.id }).from(sceneLibrary).where(eq(sceneLibrary.status, "APPROVED")).all().length;
}

/**
 * สุ่ม 1 scene จาก APPROVED (exclude RETIRED/PENDING/REJECTED) → bytes. [ก้อน 4]
 * ไม่มี APPROVED → throw (fail loud — ฟีมต้อง gen batch + approve ก่อน). ใช้โดย engine hybrid.
 */
export function pickApprovedScene(db: ContentDb): Uint8Array {
  const row = db.select().from(sceneLibrary).where(eq(sceneLibrary.status, "APPROVED")).orderBy(sql`RANDOM()`).limit(1).get();
  if (!row) throw new Error("ยังไม่มี approved scene — gen batch + approve ที่ /content-creator/scenes ก่อน");
  const real = safeResolveUnderRoot(process.cwd(), row.imagePath);
  if (!real) throw new Error(`scene ไม่พบ/ไม่ปลอดภัย: ${row.imagePath}`);
  return new Uint8Array(readFileSync(real));
}
