---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-post-onboarding-claim-refactor"
status: active
tags: [snapshot, ggg, referral, phase3, phase4]
related_files:
  - projects/mmv-tarots/__tests__/services/first-prediction-reward-service.test.ts
  - projects/mmv-tarots/__tests__/e2e/referral-reward-matrix-phase4.test.ts
  - projects/mmv-tarots/__tests__/lib/referral-service-phase2.test.ts
  - projects/mmv-tarots/docs/referral-phase4-smoke-checklist.md
---

# Snapshot: MMV Referral Phase 3+4 Completion

**Time**: 2026-03-15 23:58 +0700
**Context**: Execute ggg for phase 3 + 4 of post-onboarding manual-claim referral refactor with strict hard gate.

## Evidence
- Added replay determinism test for first prediction callback x3, asserting universal bonus granted once while referral payout flow remains callable on each callback.
- Added unique-constraint race fallback test (`P2002`) to verify referral payout flow still executes after universal bonus race.
- Added rollout smoke checklist for LINK and MANUAL_CODE policy validation in staging.
- Hard gate passed in site project:
  - `npm run build`
  - `npm run lint`
  - `npm run test`
- Phase commit created (no push): `f34e896`

## Next Actions
- Use checklist `docs/referral-phase4-smoke-checklist.md` during controlled rollout rehearsal.
- Run referral critical gate twice before release cut:
  - `npx vitest run __tests__/services/referral-claim-service.test.ts __tests__/services/onboarding-orchestration-service.test.ts __tests__/services/first-prediction-reward-service.test.ts __tests__/e2e/referral-reward-matrix-phase4.test.ts`

## Tags
snapshot ggg mmv-tarots referral phase3 phase4 deterministic-payout replay-race smoke-checklist

## Evidence Addendum
- 2026-03-15 23:59 +0700: Referral critical gate replayed twice with full pass (4 files, 18 tests per run).
- Commands executed:
  - npx vitest run __tests__/services/referral-claim-service.test.ts __tests__/services/onboarding-orchestration-service.test.ts __tests__/services/first-prediction-reward-service.test.ts __tests__/e2e/referral-reward-matrix-phase4.test.ts
  - npx vitest run __tests__/services/referral-claim-service.test.ts __tests__/services/onboarding-orchestration-service.test.ts __tests__/services/first-prediction-reward-service.test.ts __tests__/e2e/referral-reward-matrix-phase4.test.ts