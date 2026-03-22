# Snapshot: Phase 5.2 Referral Hardening Result

**Time**: 2026-03-08 14:42 (+07)
**Context**: `projects/mmv-tarots` - Execution of Phase 5.2 (LIFF Wrapped Referral + liff.state referral forwarding)

## Evidence
- Updated `lib/referral-utils.ts`:
  - `ReferralUtils.generateLink` now emits LIFF-wrapped URLs: `https://liff.line.me/{LIFF_ID}/...`
  - Preserves existing query params and appends `ref` safely.
  - Falls back to origin-based URL when `NEXT_PUBLIC_LIFF_ID` is missing.
- Updated `app/liff/page.tsx`:
  - Added `buildGatewayTarget(rawState, referralCode)` to forward `ref` into redirect target when needed.
  - Prevents overriding existing `ref` in `liff.state` target.
- Added essential unit tests: `__tests__/lib/referral-phase2.test.ts` (5 cases).
- Hard gates passed:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `npm test` ✅ (19 files, 121 tests)

## Apply When
- Use this pattern whenever referral attribution must survive LIFF redirect hops and deep-link transitions.

## Next Actions
- Start Phase 5.3: remove `window.location.reload()` from provider-auth finalize path.
- Add middleware protected-route enforcement and corresponding unit tests in Phase 5.4.

## Tags
#mmv-tarots #phase5-2 #referral-hardening #liff-wrap #liff-state #unit-test #sss
