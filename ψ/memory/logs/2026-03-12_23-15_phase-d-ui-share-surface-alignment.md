---
type: snapshot
project: mmv-tarots
task_id: "#universal-referral"
status: active
tags: [snapshot, referral, phase-d, ui-share]
related_files: [projects/mmv-tarots/lib/referral-utils.ts, projects/mmv-tarots/app/profile/page.tsx, projects/mmv-tarots/components/reading/share-actions.tsx]
---

# Snapshot: Phase D UI Share Surface Alignment

**Time**: 2026-03-12 23:15:27 +0700
**Context**: Execute `/ggg phase D` to align referral sharing surfaces so Profile and Prediction Share use the same universal-link contract without changing referral entitlement policy.

## Tags
- mmv-tarots
- universal-referral
- phase-d
- profile
- share-actions

## Evidence
- Added shared helper APIs in `ReferralUtils`:
  - `generateInviteLink(origin, referralCode)`
  - `generatePredictionLink(origin, predictionId, referralCode)`
- Rewired `app/profile/page.tsx` and `components/reading/share-actions.tsx` to use shared helpers.
- Extended `__tests__/lib/referral-phase2.test.ts` to verify both helper contracts.
- Hard Gate passed:
  - `npm run build`
  - `npm run lint`
  - `npm test` (`25 files`, `144 tests`)

## Apply When
- Use shared helper APIs when multiple UI surfaces build referral links from different routes to avoid behavior drift.

## Next Actions
- Continue with Phase E for hybrid surface (Link + Code) while preserving the canonical helper contract introduced in Phase D.
