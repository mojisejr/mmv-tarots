# Snapshot: Phase 2 LIFF Initialization Resilience Completed

**Time**: 2026-03-08 22:35 (+07)
**Context**: `projects/mmv-tarots` - Executed `ggg phase 2` from plan `#MMV-PHASE-5-5` to harden LIFF gateway fallback behavior and prevent state-decoding crashes.

## Insight
`liff.init()` fallback already existed, but `resolveLiffStateTarget()` could still throw on malformed URI payloads before gateway flow stabilizes. The phase closes this gap by converting URI decode failure into deterministic fallback (`/`) and validating query merge behavior.

## Evidence
- **Code**: `projects/mmv-tarots/app/liff/page.tsx` now guards `decodeURIComponent` with `try/catch` and returns `/` on malformed input.
- **Tests**: `projects/mmv-tarots/__tests__/lib/liff-phase1.test.ts` now covers malformed URI (`%E0%A4%A`) and referral merge behavior for `buildGatewayTarget`.
- **Hard Gate**: `npm run build` PASS, `npm run lint` PASS, `npm test` PASS (`133/133`).

## Apply When
- When auth entry relies on URL-carried state (`liff.state`) from external clients and the payload may be malformed or manually edited.

## Next Actions
- [ ] Start Phase 3 for manual payment checkout gateway (`app/package/checkout/page.tsx`).

## Tags
#mmv-tarots #sss #liff #phase2 #resilience #auth-hardening #ggg