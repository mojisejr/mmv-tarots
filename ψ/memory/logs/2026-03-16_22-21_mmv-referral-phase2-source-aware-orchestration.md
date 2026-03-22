---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-manual-balance-fix"
status: active
tags: [snapshot, phase2, referral, source-aware, reward-engine]
related_files:
  - projects/mmv-tarots/lib/server/services/referral-service.ts
  - projects/mmv-tarots/lib/server/services/first-prediction-reward-service.ts
  - projects/mmv-tarots/__tests__/services/first-prediction-reward-service.test.ts
---

# Snapshot: MMV Referral Phase 2 Source-Aware Orchestration

**Time**: 2026-03-16 22:21:10 +0700
**Context**: Execute ggg phase 2 to prevent manual referral path from receiving universal first prediction bonus while preserving referral payout flow.

## Tags
- phase2
- referral-reward
- source-aware-branching
- hard-gate-passed

## Evidence
- Implemented `getReferralSourceForReferee(refereeId)` in referral service to resolve source context for first-prediction orchestration.
- Updated first-prediction flow:
  - source `MANUAL_CODE` -> skip universal `FIRST_PREDICTION_BONUS`
  - source `LINK` or no source -> keep universal bonus path
  - always continue `grantReferralReward(userId)` payout evaluation.
- Added unit test case for manual source branch that verifies no universal bonus transaction and referral payout still runs.
- Hard gate passed:
  - `npm run build`
  - `npm run lint`
  - `npx vitest run __tests__/services/first-prediction-reward-service.test.ts`
  - `npx vitest run __tests__/e2e/referral-reward-matrix-phase4.test.ts`
  - `npx vitest run __tests__/e2e/referral-reliability-phase3.test.ts`
- Commit: `1407ab5`

## Next Actions
- Phase 3 should realign matrix and ledger assertion contracts so MANUAL_CODE scenarios no longer require `FIRST_PREDICTION_BONUS`.
- Add integration test to guarantee replay callbacks cannot introduce universal bonus after manual entitlement is already granted.
