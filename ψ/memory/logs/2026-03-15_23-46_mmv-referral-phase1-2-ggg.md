---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-post-onboarding-claim-refactor"
status: active
tags: [snapshot, implementation, ggg, referral, onboarding, manual-claim]
related_files:
  - projects/mmv-tarots/lib/server/services/referral-claim-service.ts
  - projects/mmv-tarots/lib/server/services/onboarding-orchestration-service.ts
  - projects/mmv-tarots/services/credit-service.ts
  - projects/mmv-tarots/__tests__/e2e/referral-reward-matrix-phase4.test.ts
  - projects/mmv-tarots/__tests__/e2e/referral-ledger-assertions.ts
---

# Snapshot: MMV Referral Phase 1+2 ggg Completed

**Time**: 2026-03-15 23:46 +0700
**Context**: Execute plan phases 1+2 for post-onboarding manual-claim eligibility and source-aware onboarding rewards.

## Evidence
- Hard Gate passed:
  - `npm run build`
  - `npm run lint`
  - `npm run test` (38 files, 199 tests)
- Referral critical replay gate passed twice:
  - `referral-claim-service.test.ts`
  - `onboarding-orchestration-service.test.ts`
  - `first-prediction-reward-service.test.ts`
  - `referral-reward-matrix-phase4.test.ts`

## What Changed
- Removed onboarding-window block from manual claim flow; eligibility now depends on one-path-only entitlement guards.
- Added idempotent link onboarding bonus `+1` in orchestration via `CreditService.grantLinkOnboardingBonus` with `externalRef=link_onboarding_bonus:<userId>`.
- Realigned reward contract from account-create semantics to onboarding-first semantics in matrix assertions.
- Updated profile referral claim gate to allow post-onboarding claim when no `referredById` exists.
- Added/updated tests for:
  - post-onboarding manual claim success path,
  - link onboarding bonus payout expectation,
  - updated scenario totals/events for S0-S4.

## Apply When
- Referral policy requires delayed rewards with strict one-path-only invariant.
- Onboarding flow needs source-aware bonus without race-condition double payout.

## Next Actions
- Start Phase 3: replay/race hardening validation for first prediction payout path under concurrent callbacks.
- Keep monitoring for legacy fixtures still asserting `ACCOUNT_CREATE_BONUS` semantics.

## Tags
snapshot ggg mmv-tarots referral phase1 phase2 post-onboarding-claim link-onboarding-bonus
