/**
 * auto-gen reconcile loop [Phase 2b] — gen-worker เรียก runGenTick ทุก ~10 นาที
 *
 * pivot: ไม่ auto-publish (Meta App Review ตัน no-company) → auto-**generate** อย่างเดียว
 * (ไม่แตะ FB เลย). ตื่นมา reconcile: "วันนี้มี daily-7 แล้วยัง? ถ้ายัง → gen ทิ้งไว้ GENERATED
 * ให้ฟีมโพสต์ FB เอง". reconcile model = เปิดเครื่องเช้า worker ตื่น gen ของวันนี้ให้ (ไม่ต้อง caffeinate ทั้งคืน).
 *
 * idempotent วันละ 1:
 *  - DB business fence (idx uniq_daily7_active [PR#101]) = 1 non-canceled artifact/targetDate
 *  - deterministic key ต่อวัน (requestKey/finalizeKey = "auto-*-<today>") → create/finalize idempotent
 *  - findExisting guard + DraftConflictError catch (race manual/auto) → skip ไม่จ่าย gen ซ้ำ
 */
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ContentDb } from "./db/client";
import { contentPosts, type ContentStatus } from "./db/schema";
import { getBrandProfile } from "./db/brand";
import { loadManifest, loadBackgroundById } from "./lib/bg-pool";
import { createDaily7Draft, finalizeDaily7Draft, DAILY7_TEMPLATE_ID } from "./daily7-service";
import { DraftConflictError } from "./db/drafts";
import { generate } from "./engine";
import { bangkokTodayISO, bangkokDayOfWeek, bangkokMinutesOfDay, hhmmToMinutes } from "./lib/time";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
// ตรงกับ daily7.tsx FONT_PATH (render ต้องใช้ — precheck เช็คก่อนจ่าย Gemini)
const FONT_PATH = join(process.cwd(), "assets", "fonts", "NotoSansThai-Bold.ttf");
const td = sql`json_extract(${contentPosts.inputData}, '$.targetDate')`;

export interface GenConfig {
  /** วันที่ gen (0=อาทิตย์..6=เสาร์) ; default ทุกวัน */
  days: number[];
  /** gen เมื่อถึง/เลยเวลานี้ของวัน (Bangkok) ; default "00:00" = ของวันนี้ gen ได้ทันทีที่ขึ้นวันใหม่ */
  slot: string;
}

/** อ่าน gen config — fail-closed (config ผิด → throw, worker ไม่ start) [เหมือน getScheduleConfig] */
export function getGenConfig(): GenConfig {
  const days = (process.env.CONTENT_GEN_DAYS ?? "0,1,2,3,4,5,6").split(",").map((s) => Number(s.trim()));
  if (days.some((n) => !Number.isInteger(n) || n < 0 || n > 6)) {
    throw new Error(`CONTENT_GEN_DAYS ผิด (ต้อง 0-6 คั่นด้วย ,): ${process.env.CONTENT_GEN_DAYS}`);
  }
  const slot = (process.env.CONTENT_GEN_SLOT ?? "00:00").trim();
  if (!HHMM.test(slot)) throw new Error(`CONTENT_GEN_SLOT ผิด (ต้อง HH:mm): ${process.env.CONTENT_GEN_SLOT}`);
  return { days, slot };
}

/** tick interval (ms) — fail-closed: ต้อง positive int [ตู๋ P2.2] (NaN → setInterval รัว) */
export function getGenTickMs(): number {
  const raw = process.env.CONTENT_GEN_TICK_MS;
  if (raw === undefined) return 10 * 60 * 1000; // default 10 นาที
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`CONTENT_GEN_TICK_MS ต้องเป็น positive int (ms): ${raw}`);
  return n;
}

/**
 * precheck ก่อนจ่าย Gemini (gen 7 คำทำนาย = paid) [ตู๋ P1.4]: CTA/brand/bg/font ต้องพร้อม
 * ไม่งั้น gen จะไป FAIL ตอน engine.generate (CTA ว่าง) หรือ render (bg/font หาย) — เสีย Gemini cost ฟรี.
 */
export function precheckGenReady(db: ContentDb): { ok: boolean; reason?: string } {
  const brand = getBrandProfile(db);
  if (!brand.ctaUrl.trim()) return { ok: false, reason: "CTA ว่าง — ตั้ง ctaUrl ใน Settings ก่อน (engine บังคับ CTA)" };
  // อ่าน bg bytes จริง (sha256 + dim) ของ id ที่ render จะใช้ — ไม่ใช่แค่ manifest.length [ตู๋ P1.2]
  // (corrupt/missing/sha ไม่ตรง → throw ที่นี่ แทนที่จะ burn gen 7 คำทำนายก่อน fail ตอน render)
  try {
    const manifest = loadManifest();
    if (manifest.length === 0) return { ok: false, reason: "bg pool ว่าง (manifest ไม่มี entry)" };
    loadBackgroundById(manifest[0].id); // = path ที่ runGenTick ใช้ (manifest[0])
  } catch (e) {
    return { ok: false, reason: `bg ใช้ไม่ได้: ${e instanceof Error ? e.message : String(e)}` };
  }
  // อ่าน font bytes จริง (เหมือน render loadFont) — ไม่ใช่แค่ existsSync [ตู๋ P1.2]
  try {
    readFileSync(FONT_PATH);
  } catch {
    return { ok: false, reason: `font อ่านไม่ได้: ${FONT_PATH}` };
  }
  return { ok: true };
}

/** จำนวน daily-7 CANCELED ของ targetDate (= epoch) — เปลี่ยน gen key หลัง cancel เพื่อ gen ใหม่ได้ [ตู๋ P1.1] */
export function countCanceledDaily7(db: ContentDb, targetDate: string): number {
  return db
    .select({ id: contentPosts.id })
    .from(contentPosts)
    .where(and(eq(contentPosts.templateId, DAILY7_TEMPLATE_ID), eq(contentPosts.status, "CANCELED"), sql`${td} = ${targetDate}`))
    .all().length;
}

/** daily-7 ของ targetDate ที่ยังไม่ถูกยกเลิก (fence การันตี ≤1 row) — null ถ้ายังไม่มี */
export function findDaily7ByTargetDate(db: ContentDb, targetDate: string): { id: string; status: ContentStatus } | null {
  const row = db
    .select({ id: contentPosts.id, status: contentPosts.status })
    .from(contentPosts)
    .where(and(eq(contentPosts.templateId, DAILY7_TEMPLATE_ID), ne(contentPosts.status, "CANCELED"), sql`${td} = ${targetDate}`))
    .orderBy(asc(contentPosts.createdAt))
    .limit(1)
    .get();
  return row ?? null;
}

export interface GenTickDeps {
  config: GenConfig;
  /** inject สำหรับ test ; default = ตอนนี้จริง */
  now?: Date;
}

export interface GenTickResult {
  today: string;
  window: "closed-day" | "closed-time" | "open";
  action: "none" | "skip-precheck" | "skip-exists" | "skip-failed" | "resumed" | "generated" | "gen-failed";
  status?: ContentStatus;
  note: string;
}

/**
 * reconcile 1 รอบ: gen daily-7 ของวันนี้ถ้ายังไม่มี (idempotent). ไม่แตะ FB.
 */
export async function runGenTick(db: ContentDb, deps: GenTickDeps): Promise<GenTickResult> {
  const now = deps.now ?? new Date();
  const today = bangkokTodayISO(now);

  // gate: วัน + เวลา (Bangkok) — reconcile, ไม่ fire-at-slot เป๊ะ (เลยเวลาแล้วก็ยัง gen ให้)
  if (!deps.config.days.includes(bangkokDayOfWeek(now))) {
    return { today, window: "closed-day", action: "none", note: "วันนี้ไม่อยู่ใน gen days" };
  }
  if (bangkokMinutesOfDay(now) < hhmmToMinutes(deps.config.slot)) {
    return { today, window: "closed-time", action: "none", note: `ยังไม่ถึง gen slot (${deps.config.slot})` };
  }

  // precheck ก่อนจ่าย Gemini [ตู๋ P1.4]
  const pc = precheckGenReady(db);
  if (!pc.ok) return { today, window: "open", action: "skip-precheck", note: pc.reason ?? "precheck ไม่ผ่าน" };

  // มี daily-7 ของวันนี้แล้วหรือยัง (fence → ≤1 row)
  const existing = findDaily7ByTargetDate(db, today);
  if (existing) {
    if (existing.status === "PENDING") {
      // resume: เคยสร้าง post แต่ gen ค้าง (worker ตายก่อน gen เสร็จ) → gen ต่อ
      const gen = await generate(db, existing.id);
      const status = statusOf(db, existing.id);
      return { today, window: "open", action: gen.ok ? "resumed" : "gen-failed", status, note: gen.ok ? "resume gen สำเร็จ" : `resume gen ล้ม: ${gen.error ?? gen.status}` };
    }
    if (existing.status === "FAILED") {
      // ไม่ retry ใน tick loop (กัน burn) — surface ให้ฟีมจัดการมือ [ตู๋ P2]
      return { today, window: "open", action: "skip-failed", status: "FAILED", note: "auto-gen วันนี้ FAILED — ต้อง manual resolve (ยกเลิก/regen เอง)" };
    }
    // GENERATED / APPROVED / PUBLISHING / POSTED → มีของวันนี้แล้ว
    return { today, window: "open", action: "skip-exists", status: existing.status, note: `daily-7 วันนี้มีแล้ว (${existing.status})` };
  }

  // ยังไม่มี → create draft (gen 7) → finalize (สร้าง contentPost) → generate (รูป+caption)
  // epoch = จำนวน CANCELED ของวันนี้ → key เปลี่ยนหลังลบ → gen ใหม่ได้ (ไม่ติด replay draft/finalize เดิม) [ตู๋ P1.1]
  // ภายใน epoch เดิม (retry ไม่มี cancel เพิ่ม) → key เดิม → idempotent ไม่ gen ซ้ำ
  const epoch = countCanceledDaily7(db, today);
  const draft = await createDaily7Draft(db, `auto-daily7-${today}-${epoch}`, today);
  if (draft.status === "FAILED") {
    return { today, window: "open", action: "gen-failed", note: `draft gen FAILED: ${draft.error ?? "unknown"}` };
  }
  const bgId = loadManifest()[0].id; // precheck การันตีว่า manifest ไม่ว่างแล้ว
  let contentPostId: string;
  try {
    contentPostId = finalizeDaily7Draft(db, draft.id, `auto-finalize-${today}-${epoch}`, draft.revision, bgId).contentPostId;
  } catch (e) {
    // race: manual/auto path อื่นสร้าง daily-7 วันนี้ระหว่าง findExisting→finalize → fence ชน → idempotent skip
    if (e instanceof DraftConflictError) {
      const ex = findDaily7ByTargetDate(db, today);
      return { today, window: "open", action: "skip-exists", status: ex?.status, note: "daily-7 วันนี้ถูกสร้างไปแล้ว (race) — skip" };
    }
    throw e;
  }
  const gen = await generate(db, contentPostId);
  const status = statusOf(db, contentPostId);
  return { today, window: "open", action: gen.ok ? "generated" : "gen-failed", status, note: gen.ok ? "gen สำเร็จ → GENERATED รอโพสต์เอง" : `gen ล้ม: ${gen.error ?? gen.status}` };
}

function statusOf(db: ContentDb, id: string): ContentStatus | undefined {
  return db.select({ status: contentPosts.status }).from(contentPosts).where(eq(contentPosts.id, id)).get()?.status;
}
