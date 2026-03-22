# Snapshot: MMV Referral Post-Onboarding Claim Refactor Blueprint

**Time**: 2026-03-15 23:35 +0700
**Context**: Detailed refactoring plan with precise coverage matrix for new referral flow

---
type: plan
project: mmv-tarots
task_id: "#mmv-referral-post-onboarding-claim-refactor"
status: active
tags: [plan, blueprint, referral, onboarding, manual-claim, reward-policy]
related_files:
  - projects/mmv-tarots/lib/server/services/onboarding-orchestration-service.ts
  - projects/mmv-tarots/lib/server/services/referral-claim-service.ts
  - projects/mmv-tarots/lib/server/services/referral-service.ts
  - projects/mmv-tarots/lib/server/services/first-prediction-reward-service.ts
  - projects/mmv-tarots/services/credit-service.ts
  - projects/mmv-tarots/app/profile/page.tsx
  - projects/mmv-tarots/constants/referral.ts
  - projects/mmv-tarots/__tests__/e2e/referral-reward-matrix-phase4.test.ts
---

## Objective
- Refactor referral flow to match target behavior exactly:
  - Every new user gets +1 after onboarding completion.
  - Link-attributed user gets +1 extra at onboarding completion.
  - First successful prediction always grants universal +1 after spend.
  - Referrer gets +2 when referee reaches first successful prediction.
  - Manual-code claim is allowed once even after onboarding, only if user has no prior entitlement.
  - Manual-code path grants referee +2 and referrer +2 at first successful prediction.

## Scope
- In Scope:
  - Onboarding payout logic (base + link bonus)
  - Manual claim eligibility after onboarding
  - Source-aware payout timing on first prediction
  - UI claim-eligibility gate alignment
  - Unit/API/E2E matrix refresh
- Out of Scope:
  - Non-referral UI redesign
  - Payment package business logic changes
  - Authentication provider architecture changes

## Policy Contract (Target)
- Scenario A (no referral): onboarding +1; first completion -1 +1; referrer +0.
- Scenario B (link): onboarding +1 base +1 link; first completion -1 +1; referrer +2; manual claim later denied.
- Scenario C (no link then manual code, post-onboarding): onboarding +1; claim binds entitlement only; first completion -1 +1 +2 manual-referee; referrer +2.

## Phases
### Phase 1 - Contract and Event Realignment
- Deliverables:
  - Freeze updated truth table with A/B/C + deny cases.
  - Remove semantic drift between ACCOUNT_CREATE vs ONBOARDING events in test contracts.
  - Define one-path-only invariant as canonical rule.
- Critical Test Cases:
  - Truth table assertions for totals and event order.
  - Deny cases: self-referral, duplicate claim, link-then-manual claim.
- Exit Criteria:
  - Policy is unambiguous and accepted as single source of truth.

### Phase 2 - Onboarding and Claim Service Refactor
- Deliverables:
  - Add idempotent link onboarding bonus +1 in onboarding orchestration.
  - Remove onboardingCompleted hard block from manual claim service.
  - Keep entitlement/referredById guards to preserve one-path-only.
  - Update profile claim visibility to reflect new eligibility.
- Critical Test Cases:
  - New user no link: onboarding gives +1 only.
  - New user link: onboarding gives +2 total (base + link).
  - Post-onboarding manual claim succeeds when no entitlement exists.
  - Link-attributed user manual claim returns 409.
  - Repeated manual claim attempts are blocked deterministically.
- Exit Criteria:
  - Service/API tests pass with stable response contracts.

### Phase 3 - First Prediction Payout Determinism
- Deliverables:
  - Validate source-specific payout at first successful prediction:
    - LINK: referrer +2 only (besides universal).
    - MANUAL_CODE: referee +2 and referrer +2 (besides universal).
  - Preserve idempotency keys and guarded transition updates.
- Critical Test Cases:
  - Replay completion callback 2-3 times: no duplicate payout.
  - Concurrent completion race: single payout outcome.
  - Source split payout correctness for B/C scenarios.
- Exit Criteria:
  - Ledger remains deterministic under replay and race conditions.

### Phase 4 - E2E Matrix and Rollout Evidence
- Deliverables:
  - Expand matrix scenarios and ledger assertion helper for new policy.
  - Add post-onboarding manual-claim e2e path.
  - Add smoke checklist for LINK and MANUAL_CODE flows.
- Critical Test Cases:
  - Web/LIFF first-touch parity remains correct.
  - Manual claim after onboarding works only for eligible users.
  - Referrer +2 triggers only when referee first prediction succeeds.
- Exit Criteria:
  - Hard gate pass + referral subset replay pass x2.
  - Go/No-Go evidence produced for controlled rollout.

## Risks and Rollback
- Risk: Post-onboarding claim introduces duplicate entitlement.
  - Countermeasure: multi-guard checks + idempotent externalRef.
- Risk: Legacy test fixtures misrepresent runtime policy.
  - Countermeasure: replace stale event assumptions in matrix fixtures.
- Risk: Async completion race causes overpay.
  - Countermeasure: transaction-guarded updateMany and replay stress.

### Rollback Strategy
- Trigger: Any payout mismatch in staging matrix or anomaly alert.
- Steps:
  - Disable reward engine via MMV_REFERRAL_REWARD_ENGINE_DISABLED.
  - Revert phase-scoped commits for new policy.
  - Run reconciliation queries before re-enable.

## Verification Strategy (Hard Gate)
- Build: cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build
- Lint: cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint
- Test: cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test
- Referral Critical Gate (run twice):
  - cd /Users/non/dev/opilot/projects/mmv-tarots && npx vitest run __tests__/services/referral-claim-service.test.ts __tests__/services/onboarding-orchestration-service.test.ts __tests__/services/first-prediction-reward-service.test.ts __tests__/e2e/referral-reward-matrix-phase4.test.ts

## Precise Coverage Matrix
- Unit:
  - Onboarding base/link idempotency
  - Post-onboarding manual claim eligibility
  - Source-specific first-prediction payout behavior
- API:
  - /api/user/onboarding reward payload
  - /api/user/referral-claim success and deny contracts
- E2E:
  - Scenario A/B/C end-state ledger totals
  - Link-first then manual-claim deny path
  - Manual claim after onboarding then first prediction payout chain

## Definition of Done
- Runtime behavior matches target flow exactly.
- User can use only one referral path (LINK or MANUAL_CODE).
- Post-onboarding manual claim works for eligible users.
- Hard gate and replay gates pass with evidence.

## Tags
plan ppp mmv-tarots referral post-onboarding-claim reward-policy

## Execution Update
- 2026-03-15 23:46 +0700: Phase 1 marked DONE.
  - Contract realigned to onboarding-first universal flow (`ONBOARDING_BONUS`, `FIRST_PREDICTION_BONUS`) and source-aware `LINK_ONBOARDING_BONUS`.
  - Truth table frozen for S0-S4 with post-onboarding manual-claim success path.
- 2026-03-15 23:46 +0700: Phase 2 marked DONE.
  - Removed `onboardingCompleted` block from manual claim service.
  - Added idempotent link onboarding bonus in orchestration + credit service (`externalRef: link_onboarding_bonus:<userId>`).
  - Updated profile claim gate to one-path-only (`!referredById`).
- 2026-03-15 23:58 +0700: Phase 3 marked DONE.
  - Strengthened first-prediction determinism tests for replayed callbacks (3 passes) and unique-constraint race fallback.
  - Verified source-specific payout split remains correct (`LINK`: referrer only, `MANUAL_CODE`: referee + referrer).
  - Preserved idempotency guards and transition race protection (`updateMany` claim gate) under service tests.
- 2026-03-15 23:58 +0700: Phase 4 marked DONE.
  - Extended rollout evidence with smoke checklist for LINK and MANUAL_CODE flows (`docs/referral-phase4-smoke-checklist.md`).
  - Confirmed phase matrix + replay assertions via referral critical suite.
  - Hard gate passed: `npm run build`, `npm run lint`, `npm run test`.
  - Phase commit: `f34e896` (`test(referral): complete phase3+4 determinism and smoke checklist #mmv-referral-post-onboarding-claim-refactor`).

