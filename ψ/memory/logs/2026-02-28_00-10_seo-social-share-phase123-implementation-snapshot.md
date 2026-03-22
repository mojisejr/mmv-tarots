# Snapshot: SEO + Social Share Phase 1-3 Implementation (maemormimi)

**Local Time**: 2026-02-28 00:10:53 +07
**Project**: `projects/mmv-tarots`
**Issue**: N/A
**Scope**: Implement Phase 1-3 in one pass (Domain canonicalization, Social metadata, SEO routes)
**Status**: ✅ Completed and committed on `staging`

---

## 🎯 Objective
แก้ปัญหา social share ไม่ขึ้น preview หลังเปลี่ยนโดเมนเป็น `https://www.maemormimi.com` และลดความเสี่ยง SEO จาก metadata/canonical ที่ไม่ครบ

---

## ✅ What Was Implemented

### Phase 1 — Domain + Metadata Foundation
- เพิ่ม utility กลาง: `lib/shared/seo.ts`
  - `DEFAULT_SITE_URL` = `https://www.maemormimi.com`
  - `resolveSiteUrl()` normalize URL (รองรับ input ไม่ใส่ protocol)
  - `getSiteUrl()` ดึงจาก env (`NEXT_PUBLIC_APP_URL` หรือ `NEXT_PUBLIC_SITE_URL`) พร้อม fallback
  - `resolveAbsoluteUrl()` สำหรับประกอบ absolute URL

- อัปเดต `app/layout.tsx`
  - เปลี่ยน `metadataBase` เป็น dynamic จาก `getSiteUrl()`
  - เพิ่ม `alternates.canonical`
  - เพิ่ม `openGraph` (title/description/url/siteName/images)
  - เพิ่ม `twitter` card (`summary_large_image`)

### Phase 2 — Open Graph Image
- เพิ่ม route `app/opengraph-image.tsx`
  - สร้าง OG image ขนาด 1200x630 ผ่าน `next/og`
  - ใช้เป็น default social preview image

### Phase 3 — Technical SEO Routes
- เพิ่ม `app/robots.ts`
  - กำหนด rules allow crawl
  - ชี้ `sitemap` และ `host` ไป canonical domain

- เพิ่ม `app/sitemap.ts`
  - Generate static sitemap สำหรับ route หลัก (`/`, `/history`, `/package`, `/policy`, `/profile`, `/share`, `/submitted`)

---

## 🧪 Verification Results

### Build
- Command: `npm run build`
- Result: ✅ PASS
- Notes: มี warning เดิมของโปรเจกต์ (viewport metadata format/deprecation) แต่ไม่ทำให้ build fail

### Lint
- Command: `npm run lint`
- Result: ✅ PASS

### Tests (Topic-focused)
- Command: `npm run test -- __tests__/lib/seo.test.ts __tests__/app/seo-routes.test.ts`
- Result: ✅ PASS (7/7 tests)

---

## 🧩 New/Updated Files
- `app/layout.tsx`
- `app/opengraph-image.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `lib/shared/seo.ts`
- `__tests__/lib/seo.test.ts`
- `__tests__/app/seo-routes.test.ts`

---

## 🧾 Commit Record
- Branch: `staging`
- Commit: `1249206`
- Message: `feat: implement seo and social share metadata for maemormimi domain`

---

## Next Recommended Ops
1. Deploy staging/prod revision ที่มี commit นี้
2. Re-scrape URL ด้วย social debuggers (Facebook/LINE/X) เพื่อล้าง cache preview
3. ตรวจ `https://www.maemormimi.com/robots.txt` และ `https://www.maemormimi.com/sitemap.xml` หลัง deploy
