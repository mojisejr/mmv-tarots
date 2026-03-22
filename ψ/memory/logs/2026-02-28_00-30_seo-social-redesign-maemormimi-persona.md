# Snapshot: SEO & Social Share Redesign (Maemormimi Persona)

**Local Time**: 2026-02-28 00:30:00 +07
**Project**: `projects/mmv-tarots`
**Issue**: Redesign SEO/Social to match Persona & Omise Compliance
**Scope**: `app/layout.tsx`, `app/opengraph-image.tsx`
**Status**: ✅ Implemented & Verified locally

---

## 🎯 Objective
Redesign textual and visual identity of SEO/Social metadata to align with "Maemormimi" (Mother Doctor Mimi) persona—warm, friendly, mystic—while strictly adhering to Omise compliance (avoiding "guarantee" or "karma fixing" claims).

---

## ✅ What Was Implemented

### 1. Persona-Driven Content (The Voice)
- **Title**: Changed from "MimiVibe..." to **"แม่หมอมีมี่ (Maemormimi) - ไพ่ทาโรต์ฮีลใจ ไขคำตอบชีวิต"**
- **Description**: Crafted a new bio:
  > "ปรึกษาดวงชะตา ไพ่ทาโรต์ออนไลน์ กับ 'แม่หมอมีมี่' ชัดเจน ตรงประเด็น! เพื่อนคู่คิด มิตรคู่ใจ พร้อมฮีลใจให้คุณก้าวต่อไป"
- **Keywords**: Added Thai jargon: `ดูดวง`, `ไพ่ยิปซี`, `ความรัก`, `ฮีลใจ`.

### 2. Social Visuals (The Vibe)
- **Design**: Swapped dark/cyber aesthetic for **"Mystic Warmth"**.
- **Gradient**: Deep Purple (`#2B234A`) → Rose Gold/Soft Red (`#F27669`).
- **Typography**: Large Thai headline "แม่หมอมีมี่" with shadow for readability, clean "maemormimi.com" badge.
- **Font Strategy**: Added `fetch` for `Noto Sans Thai` (Google Fonts) to ensure Thai text renders correctly on Vercel Edge Runtime.

### 3. Technical Clean-up
- **Refactoring**: Moved `viewport` config out of `metadata` export in `app/layout.tsx` (Next.js 14+ best practice).
- **Omise Check**: Verified copy.
  - ❌ Avoided: "แก้กรรม", "รับประกันผล", "รวยเร็ว".
  - ✅ Used: "ปรึกษา" (Consult), "ไขคำตอบ" (Find answers), "ฮีลใจ" (Heal heart/Wellness).
  - **Verdict**: Compliant with "Entertainment/Consultation" category.

---

## 🧪 Verification Results

### Build (`npm run build`)
- **Result**: ✅ PASS (Compiled successfully in ~6s)
- **Static Gen**: ✅ ALL pages generated (including `opengraph-image` as Edge Function).
- **Lint**: ✅ PASS.

### Visual Check
- **OG Image**: Validated code structure for Vercel ImageResponse. Text alignment and gradient CSS are standard.

---

## 🧩 Files Changed
- `app/layout.tsx`: Updated `title`, `description`, `keywords`, `openGraph`, `twitter`, `viewport`.
- `app/opengraph-image.tsx`: Complete rewrite for new design key.

---

## 🚀 Next Steps
1. **Commit & Push**: Apply changes to `staging`.
2. **Deploy**: Verify OG Image on production URL using [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) / [Twitter Card Validator](https://cards-dev.twitter.com/validator).
3. **Monitor**: Check Omise dashboard for approval status (content now aligns with "Digital Content/Consultation").

```