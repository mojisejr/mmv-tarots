# Snapshot: Phase 1 Domain Normalization Guard Completed

**Time**: 2026-03-08 22:29 (+07)
**Context**: `projects/mmv-tarots` - Executed `ggg phase 1` from plan `#MMV-PHASE-5-5` to prevent LIFF failure caused by `www` host mismatch.

## Insight
Domain normalization is now enforced at middleware edge. Any request with host prefix `www.` is permanently redirected (`301`) to root domain while preserving full path and query string. This closes the production failure path where LIFF validates against root domain only.

## Evidence
- **Code**: `projects/mmv-tarots/middleware.ts` now checks host and redirects `www.*` to non-www.
- **Test**: `projects/mmv-tarots/__tests__/middleware.test.ts` includes case for `https://www.maemormimi.com/liff?ref=FRIEND123&from=line` and asserts normalized redirect location.
- **Hard Gate**: `npm run build` PASS, `npm run lint` PASS, `npm test` PASS (`131/131`).
- **Commit**: `608ec46` (`feat(auth): phase 1 domain normalization guard (#MMV-PHASE-5-5)`).

## Apply When
- Any LINE LIFF app where console endpoint is registered on root domain only.
- Any auth flow that can be entered from multiple host aliases (`www` vs root).

## Next Actions
- [ ] Phase 2: Add `try/catch` and fallback redirect around `liff.init()` in `app/liff/page.tsx`.
- [ ] Add focused test for fallback behavior when LIFF initialization throws.

## Tags
#mmv-tarots #sss #domain-normalization #liff #phase1-complete #hard-gate