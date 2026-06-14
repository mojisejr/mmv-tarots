/**
 * Brand Profile API [S3.5b/c] — singleton "default" row + Mimi defaults.
 *
 * getBrandProfile: คืน row ที่ override บน DEFAULT_BRAND (ฟีมแก้บางfield ก็ merge ทับ default)
 *   → out-of-box เป็น "หมอมี่" ทันที (ref + style + persona) แม้ยังไม่เคยตั้งค่า
 * updateBrandProfile: upsert id="default"
 */
import { eq } from "drizzle-orm";
import type { ContentDb } from "./client";
import { brandProfile, type BrandProfile } from "./schema";

const SINGLETON_ID = "default";

/** ref ของ "หมอมี่" ที่ commit เป็น brand asset (ดู memory mmv-brand-spec) */
export const DEFAULT_REF_PATH = "content-creator/brand/mimi-reference.png";

/** ค่าเริ่มต้นแบรนด์หมอมี่ — derive จาก brand spec ที่ verify ด้วย spike (ไม่เดา) */
export const DEFAULT_BRAND: Omit<BrandProfile, "updatedAt"> = {
  id: SINGLETON_ID,
  stylePrompt:
    "การ์ตูนน่ารักสไตล์ digital illustration soft painterly, โทนพาสเทล ชมพู-ม่วงลาเวนเดอร์-ทอง-ฟ้าอ่อน, " +
    "ธีมหมอดู/มงคล (ลูกแก้วคริสตัล ไพ่ทาโรต์ เทียน คริสตัล), ดวงดาวระยิบ พระจันทร์/ดวงอาทิตย์ทอง, highlight เรืองแสง, อบอุ่นสดใส",
  captionPersona:
    "เขียนแบบ 'หมอมี่' — แมวหมอดูน่ารัก สดใส เป็นกันเอง ฟันธงชัด พูดให้กำลังใจเรื่องการเงิน ใช้ภาษาไทยติดดิน อิโมจิพอประมาณ",
  refImagePath: DEFAULT_REF_PATH,
  imageModel: null,
  captionMaxChars: 300,
  // CTA default — ฟีมแก้ใน settings ให้ตรงระบบจริง (link/handle)
  ctaText: "อยากรู้ดวงการเงินแบบเจาะลึกของตัวเอง? ทักหาพี่หมี่ดูดวงเต็ม ๆ ได้เลย",
  ctaUrl: "",
};

/**
 * อ่าน brand profile — มี fallback DEFAULT เสมอ.
 * field ที่ row "ว่าง" (เช่น row เก่าก่อนมี cta/maxChars หลัง migration) → fallback DEFAULT
 * เพื่อให้ CTA/length ไม่ถูกปิดเงียบ [ตู๋ P1]. (ctaUrl ว่าง = ฟีมตั้งใจไม่ใส่ link — เคารพ)
 */
export function getBrandProfile(db: ContentDb): BrandProfile {
  const row = db.select().from(brandProfile).where(eq(brandProfile.id, SINGLETON_ID)).get();
  if (!row) return { ...DEFAULT_BRAND, updatedAt: new Date() };
  return {
    ...row,
    captionPersona: row.captionPersona || DEFAULT_BRAND.captionPersona,
    ctaText: row.ctaText || DEFAULT_BRAND.ctaText, // ว่าง → DEFAULT (CTA text บังคับมีเสมอ)
    captionMaxChars: row.captionMaxChars || DEFAULT_BRAND.captionMaxChars,
  };
}

export type BrandProfilePatch = Partial<
  Pick<BrandProfile, "stylePrompt" | "captionPersona" | "refImagePath" | "imageModel" | "captionMaxChars" | "ctaText" | "ctaUrl">
>;

/** upsert singleton (ฟีมแก้จาก settings UI) */
export function updateBrandProfile(db: ContentDb, patch: BrandProfilePatch): BrandProfile {
  const existing = db.select().from(brandProfile).where(eq(brandProfile.id, SINGLETON_ID)).get();
  const merged = { ...(existing ?? DEFAULT_BRAND), ...patch, id: SINGLETON_ID, updatedAt: new Date() };
  db.insert(brandProfile)
    .values(merged)
    .onConflictDoUpdate({ target: brandProfile.id, set: { ...patch, updatedAt: new Date() } })
    .run();
  return getBrandProfile(db);
}
