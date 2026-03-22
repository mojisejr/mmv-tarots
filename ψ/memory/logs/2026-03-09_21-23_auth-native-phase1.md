# Snapshot: MMV Auth Native v3.1 - Phase 1 Complete

**Time**: 2026-03-09 21:23 +0700
**Context**: ดำเนินการ `ggg phase 1` สำเร็จ โดย refactor LIFF verify route ให้กลับมาอยู่บน Better-Auth contract แบบ native และผ่าน Hard Gate ครบ

## Evidence
- Updated file: `projects/mmv-tarots/app/api/auth/liff-verify/route.ts`
- Removed direct manual cookie path:
  - ลบ `serializeSignedCookie`
  - ลบ `SESSION_COOKIE_NAME` hardcoded usage
- Native issuance path now uses:
  - `auth.$context.internalAdapter.createSession(user.id)`
  - `getCookies(auth.options)` สำหรับ cookie naming/options
  - Better-Call `setSignedCookie` ผ่าน endpoint context สำหรับ signature ที่สอดคล้องกับ Better-Auth secret
- Hard Gate:
  - `npm run build` passed
  - `npm run lint` passed
  - `bun run test` passed (`20` test files, `134` tests)

## Next Actions
- Phase 2: Durable redirect state (`mmv_target`) ใน `app/liff/page.tsx`
- เพิ่ม targeted tests สำหรับ `liff-verify` (token invalid/channel mismatch/session issuance)

## Tags
`sss` `mmv-tarots` `auth` `better-auth` `liff` `phase1` `ggg`