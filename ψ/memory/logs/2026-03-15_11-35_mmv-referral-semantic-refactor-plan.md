# Snapshot: MMV Referral Semantic Refactor Blueprint

**Time**: 2026-03-15 11:35 +0700
**Context**: Comprehensive /ppp after grounding against updated reward intent

---
type: plan
project: mmv-tarots
task_id: "#mmv-referral-semantic-refactor"
status: active
tags: [plan, blueprint, referral, reward-policy, refactor]
related_files:
  - projects/mmv-tarots/constants/referral.ts
  - projects/mmv-tarots/prisma/schema.prisma
  - projects/mmv-tarots/lib/server/services/referral-service.ts
  - projects/mmv-tarots/services/credit-service.ts
  - projects/mmv-tarots/app/api/user/onboarding/route.ts
  - projects/mmv-tarots/app/api/user/referral-claim/route.ts
  - projects/mmv-tarots/lib/server/auth.ts
  - projects/mmv-tarots/services/tarot-service.ts
  - projects/mmv-tarots/app/api/predict/route.ts
---

## Objective
- Refactor referral/reward domain to enforce updated product intent exactly:
  - Base star after account creation (universal): `+1`
  - Onboarding completion reward (universal): `+1`
  - First successful prediction reward (universal): `+1`
  - Manual referral-code bonus path: grant `+2` to referee only after first successful prediction
  - Referrer reward: grant `+2` when referee reaches first successful prediction
  - Manual claim is only allowed if user has NOT already consumed referral via link/onboarding path.

## Grounding Summary (As-Is)
- Existing `User.stars` default is `0`, not `1`.
- Onboarding currently grants referral entry bonus immediately when `referredById` exists.
- First prediction currently calls delayed reward and grants referrer `+2` plus referee `+1`.
- System cannot distinguish referral source (`link` vs `manual code`) in persisted referral model.
- `referral-check` endpoint is intentionally no-op and should remain so.
- Test-first readiness Phase 1-4 was completed on 2026-03-15 and can be reused as baseline.

## Scope
- In Scope:
  - Reward policy model refactor (domain + schema + orchestration).
  - Source-aware referral attribution and claim eligibility enforcement.
  - End-to-end reward trigger normalization on first successful prediction.
  - Full contract test update (unit/api/e2e + migration safety tests).
  - Production observability plan for payout correctness and regression detection.
- Out of Scope:
  - UI redesign unrelated to reward/referral semantics.
  - Payment package logic refactor outside referral reward intersections.
  - Non-referral auth-provider architecture changes.

## Canonical Reward Contract (Target)
- Universal rewards:
  - `ACCOUNT_CREATE_BONUS = +1`
  - `ONBOARDING_BONUS = +1`
  - `FIRST_PREDICTION_BONUS = +1`
- Referral rewards:
  - `REFERRER_BONUS = +2` at referee first successful prediction.
  - `MANUAL_CLAIM_REFEREE_BONUS = +2` at referee first successful prediction.
  - Link-based attribution does NOT unlock manual-claim bonus path later.
- Safety invariants:
  - Each reward type is idempotent, exactly-once per user per policy boundary.
  - Reward issuance must be source-aware and auditable.
  - Legacy `referral-check` remains strict no-op.

## Referral Source Model (Target)
- Introduce explicit attribution source and lifecycle to avoid ambiguous logic:
  - Source enum: `LINK`, `MANUAL_CODE`
  - Eligibility state: `PENDING_FIRST_PREDICTION`, `GRANTED`, `BLOCKED`, `CANCELED`
  - One canonical active referral entitlement per user.
- Manual claim constraints:
  - Reject if user already has link-attributed referral or any consumed referral entitlement.
  - Reject after onboarding completion if policy requires pre-onboarding-only claim.

## Phases

### Phase 0 - Policy Lock and Truth Table Freeze
- Deliverables:
  - Product-technical truth table covering all entry paths:
    - no referral
    - referral link before signup
    - manual code before onboarding
    - manual code after onboarding attempt
    - link first then manual claim attempt
  - Signed contract doc for exact reward totals and timing.
- Critical Test Cases:
  - Path matrix assertion doc maps each path to expected credits and ledger entries.
  - Explicit deny-case for "link-consumed user claiming manual code later".
- Exit Criteria:
  - No ambiguous policy branch remains.
  - Contract accepted as pre-code source of truth.

### Phase 1 - Schema and Domain State Refactor (Behavior Guarded)
- Deliverables:
  - Prisma migration adding source-aware referral fields/state.
  - Backfill strategy for existing referral history records.
  - Domain types/constants for new reward events and referral source.
- Critical Test Cases:
  - Migration dry-run on snapshot data keeps old records queryable.
  - Legacy records map deterministically to source/status defaults.
- Exit Criteria:
  - `prisma migrate` applies cleanly in dev.
  - No data-loss or invalid nullability in referral tables.

### Phase 2 - Orchestration Refactor (Onboarding and Claim)
- Deliverables:
  - Move onboarding and referral decision logic into dedicated service layer.
  - `onboarding` route becomes thin transport layer only.
  - `referral-claim` route enforces source-aware eligibility rules.
- Critical Test Cases:
  - Onboarding grants exactly universal onboarding bonus once.
  - Onboarding does NOT grant manual referral bonus immediately.
  - Manual claim rejected for link-attributed users.
  - Manual claim accepted exactly once for eligible non-link users.
- Exit Criteria:
  - Route tests fully green with updated policy contract.
  - Service-level tests cover all state transitions.

### Phase 3 - First Prediction Reward Engine Consolidation
- Deliverables:
  - Single post-completion reward engine called from prediction workflow.
  - Universal first-prediction reward (`+1`) separated from referral payout logic.
  - Referral payout logic evaluates source and grants:
    - referrer `+2` always when entitlement is valid
    - referee `+2` only for `MANUAL_CODE` source
- Critical Test Cases:
  - First prediction for non-referred user grants only universal `+1`.
  - First prediction for link-referred user grants referrer `+2` without manual bonus to referee.
  - First prediction for manual-claim user grants referee `+2` and referrer `+2` once.
  - Replay of completion callback does not duplicate any reward.
- Exit Criteria:
  - Deterministic ledger outcomes across replay/concurrency tests.
  - Existing no-op endpoint invariant still intact.

### Phase 4 - Integration and E2E Matrix Expansion
- Deliverables:
  - E2E suite extension for full reward matrix and anti-regression.
  - Add DB/ledger assertion helper for end-state verification.
  - Add LIFF/web attribution parity scenarios.
- Critical Test Cases:
  - End-to-end totals for each path match truth table exactly.
  - `mmv_ref` first-touch plus manual-claim path interaction remains policy-compliant.
  - Parallel onboarding + first-prediction race cannot overpay.
- Exit Criteria:
  - Referral E2E matrix green in repeated runs (2x replay gate).
  - Scenario evidence table generated.

### Phase 5 - Production Guardrails and Controlled Rollout
- Deliverables:
  - Telemetry hooks for reward issuance events and anomaly detection.
  - Temporary dashboard/query pack for payout validation.
  - Rollout checklist with kill-switch instructions.
- Critical Test Cases:
  - Synthetic production-like replay on staging verifies no double payout.
  - Alert conditions fire on impossible reward combinations.
- Exit Criteria:
  - Go/No-Go report published with constraints.
  - Human approval captured before production rollout.

## Data Migration Strategy
- Add new nullable columns first, deploy read-compatible code.
- Backfill source/status from historical evidence:
  - If tied to cookie/link onboarding path -> `LINK`
  - If created via claim endpoint audit marker -> `MANUAL_CODE`
  - Unknown legacy rows flagged for manual review bucket.
- After backfill + verification, tighten constraints/indexes.

## Backward Compatibility Strategy
- Keep `app/api/auth/referral-check/route.ts` as no-op.
- Preserve existing API response shapes where possible; add fields additively.
- Maintain support for existing users with historic referral records.

## Risk Register and Countermeasures
- Risk: Legacy data cannot be unambiguously source-classified.
  - Countermeasure: Use conservative defaults + manual review bucket + no destructive rewrite.
- Risk: Reward duplication due to workflow retries.
  - Countermeasure: event idempotency keys and transaction-guarded state transitions.
- Risk: Semantic drift between policy doc and code changes.
  - Countermeasure: truth-table tests mandatory before merge.
- Risk: Production race conditions not visible in local tests.
  - Countermeasure: replay tests + staging stress run + telemetry alarms.

## Rollback Strategy
- Trigger:
  - Any mismatch between expected and observed ledger totals in staging/production smoke.
- Rollback:
  - Disable new reward engine via feature flag or guarded branch condition.
  - Revert to last known stable commit preserving no-op referral-check and onboarding lock.
  - Freeze referral payouts temporarily while reconciling affected transactions.
- Recovery:
  - Run reconciliation job for impacted users before re-enabling rollout.

## Verification Strategy (Hard Gate)
- Mandatory command set per slice:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Additional referral gate:
  - Run referral critical subset twice consecutively.
  - Run expanded e2e reward matrix once per merge candidate.
- Evidence capture:
  - Append command outputs and scenario tables to `ψ/memory/logs/mmv-tarots/`.

## Implementation Slices (Suggested Order)
1. Contract tests first (failing tests describing target semantics)
2. Schema + domain model
3. Onboarding/claim service refactor
4. First prediction reward engine
5. E2E expansion + telemetry
6. Final gate and rollout decision

## Definition of Done
- Reward outcomes match target truth table for all documented paths.
- No duplicate payouts under replay/concurrent conditions.
- Manual claim policy is source-aware and enforceable.
- Full hard gate passes and decision report signed off.

## Tags
`plan` `ppp` `referral` `semantic-refactor` `mmv-tarots` `reward-engine`

## Phase Progress Update

### 2026-03-15 12:17 +0700 - Phase 0 Completed
- Status: `DONE`
- Deliverables completed:
  - Truth table and policy contract frozen in `projects/mmv-tarots/docs/referral-policy-truth-table-phase0.md`
  - Explicit deny-case documented: link-consumed user cannot claim manual code later (DC-01)
- Decision:
  - Phase 1 may proceed only with additive schema migration (no destructive rewrite, no reset)

### 2026-03-15 11:54:53 +0700 - Timestamp Correction Note
- Integrity note: previous progress entry timestamp was recorded inaccurately.
- Ground-truth timestamp from system `date` for this append is `2026-03-15 11:54:53 +0700`.
- The Phase 0 completion status remains valid.

### 2026-03-15 12:01:39 +0700 - Phase 1 Completed
- Status: `DONE`
- Deliverables completed:
  - Additive Prisma migration created and applied: `prisma/migrations/20260315120500_referral_source_state_phase1/migration.sql`
  - `ReferralHistory` upgraded with source-aware fields:
    - `source` (`ReferralSource` enum)
    - `eligibility_state` (`ReferralEligibilityState` enum)
  - Domain constants/types added for phase transition:
    - `REWARD_POLICY_EVENTS`
    - `ReferralSource`
    - `ReferralEligibilityState`
  - Legacy backfill mapping helper added:
    - `lib/server/referral/referral-phase1-domain.ts`
  - Migration safety test added:
    - `__tests__/lib/referral-phase1-domain.test.ts`
- Verification:
  - `npm run build` PASS (migration deploy included)
  - `npm run lint` PASS
  - `npm run test` PASS (`33` files, `183` tests)
- Decision:
  - Proceed to Phase 2 orchestration refactor with behavior guarded by existing + new test contracts.

### 2026-03-15 12:12:38 +0700 - Phase 2 Completed
- Status: `DONE`
- Deliverables completed:
  - Onboarding decision flow moved into dedicated orchestration service:
    - `lib/server/services/onboarding-orchestration-service.ts`
  - Manual referral claim decision flow moved into dedicated orchestration service:
    - `lib/server/services/referral-claim-service.ts`
  - API routes converted to thin transport layer:
    - `app/api/user/onboarding/route.ts`
    - `app/api/user/referral-claim/route.ts`
  - Source-aware manual claim guard enforced:
    - Link-attributed entitlement path now blocked from manual claim.
  - Onboarding payout normalized for Phase 2:
    - onboarding grants universal reward only; no immediate manual referral bonus.
  - Service-level transition tests added:
    - `__tests__/services/onboarding-orchestration-service.test.ts`
    - `__tests__/services/referral-claim-service.test.ts`
  - API/E2E tests updated to orchestration contract.
- Verification:
  - `npm run build` PASS
  - `npm run lint` PASS
  - `npm run test` PASS (`35` files, `185` tests)
- Decision:
  - Proceed to Phase 3 reward engine consolidation with source-aware payout rules.

### 2026-03-15 12:12:36 +0700 - Timestamp Correction Note
- Integrity note: previous Phase 2 entry timestamp was not aligned with latest system `date` output.
- Ground-truth timestamp for this append window: `2026-03-15 12:12:36 +0700`.

### 2026-03-15 13:15:19 +0700 - Phase 3 Completed
- Status: `DONE`
- Deliverables completed:
  - Introduced single post-completion reward engine:
    - `lib/server/services/first-prediction-reward-service.ts`
  - Prediction workflows now use one engine callback:
    - `services/tarot-service.ts`
    - `lib/server/workflows/simple-tarot.ts`
  - Universal first-prediction reward added with idempotency key (`externalRef`):
    - `first_prediction_bonus:<userId>`
  - Referral payout consolidated and source-aware in `referralService.grantReferralReward`:
    - Referrer `+2` for valid entitlement
    - Referee `+2` only for `MANUAL_CODE`
    - Link-attributed entitlement skips referee manual bonus
  - Referral payout claim path hardened with transaction-guarded status transition:
    - `PENDING_FIRST_PREDICTION -> GRANTED` via conditional `updateMany`
  - New/updated tests:
    - `__tests__/services/first-prediction-reward-service.test.ts`
    - `__tests__/lib/referral-service-phase2.test.ts`
- Verification:
  - `npm run build` PASS
  - `npm run lint` PASS
  - `npm run test` PASS (`36` files, `188` tests)
- Commit:
  - `30b104c` - `feat(#mmv-referral-semantic-refactor): phase 3 first-prediction reward engine`
- Decision:
  - Proceed to Phase 4 integration/e2e matrix expansion.

### 2026-03-15 13:30:46 +0700 - Phase 4 Completed
- Status: `DONE`
- Deliverables completed:
  - Added referral reward matrix ledger assertion helper:
    - `__tests__/e2e/referral-ledger-assertions.ts`
  - Expanded E2E-style matrix verification for S0-S4 truth-table totals:
    - `__tests__/e2e/referral-reward-matrix-phase4.test.ts`
  - Added LIFF/web first-touch attribution parity checks (`mmv_ref` contract):
    - web share and LIFF entry both capture first touch and reject overwrite on reopen
  - Added deny-case regression assertion:
    - link-attributed user manual-claim attempt is rejected (DC-01)
  - Hardened replay/race safety assertion for referral payout claim transition:
    - `__tests__/lib/referral-service-phase2.test.ts` (skip payout when state already claimed)
  - Stabilized long-running card import test timing to remove flaky timeout noise in full hard gate:
    - `__tests__/app/cards-import.test.ts`
- Verification:
  - `npm run build` PASS
  - `npm run lint` PASS
  - `npm run test` PASS (`37` files, `193` tests)
- Commit:
  - `36e05ef` - `test(#mmv-referral-semantic-refactor): phase 4 reward matrix and replay guard`
- Decision:
  - Proceed to Phase 5 production guardrails and controlled rollout artifacts.

### 2026-03-15 15:25:08 +0700 - Phase 5 Completed
- Status: `DONE`
- Deliverables completed:
  - Added referral reward observability module with Sentry capture, structured events, anomaly detector, and Discord alert bridge:
    - `projects/mmv-tarots/lib/server/referral-observability.ts`
  - Wired telemetry + kill-switch into reward engine flow:
    - `projects/mmv-tarots/lib/server/services/first-prediction-reward-service.ts`
  - Added payout anomaly detection hooks and critical alert path in referral payout transition:
    - `projects/mmv-tarots/lib/server/services/referral-service.ts`
  - Added production operations artifacts:
    - `projects/mmv-tarots/docs/referral-phase5-ops-query-pack.md`
    - `projects/mmv-tarots/docs/referral-phase5-rollout-checklist.md`
    - `projects/mmv-tarots/docs/referral-phase5-go-no-go-report.md`
  - Added phase 5 regression and guardrail tests:
    - `projects/mmv-tarots/__tests__/lib/referral-observability.test.ts`
    - `projects/mmv-tarots/__tests__/services/first-prediction-reward-service.test.ts`
- Verification:
  - `npm run build` PASS
  - `npm run lint` PASS
  - `npm run test` PASS (`38` files, `197` tests)
  - Referral critical replay gate PASS x2 (`7` files, `34` tests per run)
  - Expanded reward matrix gate PASS (`1` file, `4` tests)
- Commit:
  - `a99eec6` - `feat(#mmv-referral-semantic-refactor): phase 5 production guardrails and rollout controls`
- Decision:
  - Implementation is phase-complete and ready for controlled rollout.
  - Final production rollout remains `PENDING HUMAN APPROVAL` per policy.

