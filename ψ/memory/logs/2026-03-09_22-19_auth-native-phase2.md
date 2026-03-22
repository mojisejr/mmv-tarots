# Snapshot: MMV Auth Native v3.1 - Phase 2 Complete

**Time**: 2026-03-09 22:19 +0700
**Context**: ดำเนินการ `ggg phase 2` สำเร็จ โดย harden redirect target ของ LIFF ให้ durable เมื่อ `mmv_next` หายหรือเสียรูปหลัง callback

## Evidence
- Updated `projects/mmv-tarots/app/liff/page.tsx`
  - Added `LIFF_TARGET_STORAGE_KEY = "mmv_target"`
  - Added `resolveDurableGatewayTarget(rawState, referralCode, persistedTarget)`
  - Recovery behavior: fallback to persisted target when `mmv_next` missing/malformed
  - Cleanup behavior: remove persisted target after successful session verify/redirect
- Updated `projects/mmv-tarots/lib/client/providers/navigation-provider.tsx`
  - Persist current safe path+query before entering `/liff` in `handleLoginClick`
- Updated tests `projects/mmv-tarots/__tests__/lib/liff-phase1.test.ts`
  - added durable recovery test for missing `mmv_next`
  - added malformed external `mmv_next` fallback test
- Hard Gate:
  - `npm run build` passed
  - `npm run lint` passed
  - `bun run test` passed (`20` files / `136` tests)

## Next Actions
- Phase 3: align `middleware.ts` auth contract with Better-Auth cookie/session contract (ลด hardcoded legacy branches)
- Add targeted API tests for `/api/auth/liff-verify` to lock behavior for invalid token/channel mismatch/session issuance

## Tags
`sss` `mmv-tarots` `auth` `better-auth` `liff` `phase2` `durable-state` `ggg`