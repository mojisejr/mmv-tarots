---
type: snapshot
project: mmv-tarots
task_id: "#universal-referral"
status: active
tags: [snapshot, referral, phase-e, hybrid-share]
related_files: [projects/mmv-tarots/lib/referral-utils.ts, projects/mmv-tarots/app/profile/page.tsx, projects/mmv-tarots/components/reading/share-actions.tsx]
---

# Snapshot: Phase E Hybrid Share Surface

**Time**: 2026-03-12 23:20:54 +0700
**Context**: Execute `/ggg phase E` to implement Hybrid Referral Surface (Link + Code) across profile and prediction-share UI while preserving universal-link contract.

## Tags
- mmv-tarots
- universal-referral
- phase-e
- link-plus-code
- share-surface

## Evidence
- Added hybrid payload helpers in `ReferralUtils`:
  - `composeInvitePayload(...)`
  - `composePredictionPayload(...)`
  - `formatShareMessage(...)`
- Updated `shareText.invite()` and `shareText.prediction()` to include fallback referral code when present.
- Profile UI now has separate actions:
  - Copy Link
  - Copy Referral Code
- Share Actions UI now supports copying full share message (link + code).
- Expanded tests in `__tests__/lib/referral-phase2.test.ts` for hybrid payload contract.
- Hard Gate passed:
  - `npm run build`
  - `npm run lint`
  - `npm test` (`25 files`, `146 tests`)

## Apply When
- Use hybrid payload composition when social share context can drop query params and users need a manual code fallback.

## Next Actions
- Phase F: implement manual claim slot with strict one-time guardrails and anti-self-referral validation.
