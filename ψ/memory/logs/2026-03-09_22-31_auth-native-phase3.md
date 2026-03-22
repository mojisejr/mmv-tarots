# Snapshot: MMV Auth Native v3.1 - Phase 3 Complete

**Time**: 2026-03-09 22:31 +0700
**Context**: ดำเนินการ `ggg phase 3` สำเร็จ โดย align middleware auth gate ให้ยึด Better-Auth cookie contract แบบ canonical และตัด dependency ต่อชื่อคุกกี้ hardcoded

## Evidence
- Updated `projects/mmv-tarots/middleware.ts`
  - Added import: `getSessionCookie` from `better-auth/cookies`
  - Replaced manual cookie-name checks with:
    - `getSessionCookie(request.headers, { cookiePrefix: 'mmv_auth' })`
- Behavior retained:
  - Protected route ที่ไม่มี session -> redirect ไป `/liff?mmv_next=...`
  - Protected route ที่มี valid session cookie contract -> pass-through
- Hard Gate:
  - `npm run build` passed
  - `npm run lint` passed
  - `bun run test` passed (`20` files / `136` tests)

## Next Actions
- Phase 4: Dead code cleanup รอบ auth flow (legacy symbols/constants และ stale markers)
- เพิ่ม targeted API contract tests สำหรับ `/api/auth/liff-verify` เพื่อ lock behavior error matrix

## Tags
`sss` `mmv-tarots` `auth` `better-auth` `phase3` `middleware` `cookie-contract` `ggg`