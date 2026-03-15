# MMV Referral Test Readiness - Phase 1 Baseline Truth

Plan Ref: `#mmv-referral-test-first-readiness`
Status: `DONE (Phase 1)`
Date: `2026-03-15`

## Objective
Lock a traceable baseline for referral lifecycle behavior before any behavior-changing refactor.

## 1. Referral Flow Map (Source of Truth)

1. Share/entry link contains `?ref=<code>`.
- Cookie attribution is handled by middleware and persists first-touch only.
- Code path: `middleware.ts` (`mmv_ref` set if no existing cookie).

2. LIFF entry receives `mmv_next` and optional `ref`.
- Gateway reconstructs target and preserves referral even when raw state loses query context.
- Code path: `app/liff/page.tsx` (`resolveDurableGatewayTarget`, `buildGatewayTarget`).

3. User signup/login hook records referral intent.
- Better-Auth create hook reads `mmv_ref` and calls referral recording in non-blocking mode.
- Code path: `lib/server/auth.ts` (`databaseHooks.user.create.after`).

4. Referral claim API allows manual code claim before onboarding completion.
- Rejects self/invalid/already-claimed/late window.
- Code path: `app/api/user/referral-claim/route.ts`.

5. Onboarding API is the reward entitlement gate.
- Idempotent lock on `onboardingCompleted` via `updateMany`.
- Always grants onboarding bonus once; grants referral entry bonus if linked.
- Can self-heal missing link by retrying `processReferralSignup` from cookie.
- Code path: `app/api/user/onboarding/route.ts`.

6. First successful prediction triggers delayed referral payout.
- `startTarotWorkflow` calls `referralService.grantReferralReward(userId)` after completion.
- Code path: `services/tarot-service.ts`.

7. Referral ledger and balances are finalized in referral service.
- Referrer topup + referee bonus + history status update to `GRANTED`.
- Code path: `lib/server/services/referral-service.ts`.

8. Legacy referral-check endpoint must remain no-op.
- Avoids duplicate reward paths.
- Code path: `app/api/auth/referral-check/route.ts`.

## 2. Risk-to-Test Mapping

| Priority | Risk | Code Path | Existing Coverage | Phase 2 Requirement |
|---|---|---|---|---|
| Critical | Duplicate referral history/payout under concurrent signup or onboarding retries | `lib/server/services/referral-service.ts`, `app/api/user/onboarding/route.ts` | Partial (no direct onboarding route tests, no concurrency test on referral service) | Add idempotency/concurrency tests for repeated `processReferralSignup` and parallel onboarding PATCH |
| Critical | First-touch referral cookie overwritten by later links | `middleware.ts` | Covered in `__tests__/middleware.test.ts` | Keep and extend with multi-step navigation sequence |
| High | LIFF drops query/state and loses `ref` attribution | `app/liff/page.tsx` | Covered in `__tests__/lib/liff-phase1.test.ts` | Add edge cases for explicit root state and stale persisted targets |
| High | Manual claim bypasses business rules | `app/api/user/referral-claim/route.ts` | Covered in `__tests__/api/referral-claim-route.test.ts` | Add tests for race between claim and onboarding completion |
| High | Legacy `referral-check` accidentally grants rewards | `app/api/auth/referral-check/route.ts` | Covered in `__tests__/api/referral-check-route.test.ts` | Add assertion for zero side-effect call contracts |
| Medium | Reward transaction metadata/balanceAfter drift from actual balances | `lib/server/services/referral-service.ts`, `services/credit-service.ts` | Limited direct assertions | Add transaction ledger contract tests (`amount`, `type`, `balanceAfter`, metadata source) |
| Medium | First prediction trigger runs multiple times and pays twice | `services/tarot-service.ts`, `lib/server/services/referral-service.ts` | No explicit end-to-end duplicate trigger test | Add replay/resume test for repeated completion callbacks |

## 3. Canonical Acceptance Criteria (Reward Event and Non-Event)

### Event Rules
- E1: A valid first-touch `ref` must persist as `mmv_ref` and survive protected-route redirect into LIFF gateway.
- E2: Eligible manual claim before onboarding completion must link user to one referrer exactly once.
- E3: On first successful onboarding ritual, user gets exactly one `ONBOARDING` transaction.
- E4: If user is linked to a referrer at onboarding, user gets at most one `REFERRAL` entry bonus.
- E5: After first successful prediction, pending referral history becomes `GRANTED`, and referrer gets exactly one reward transaction.

### Non-Event Rules
- N1: Invalid/self referral code must never link or reward.
- N2: Repeated onboarding requests must not create duplicate onboarding/referral-entry transactions.
- N3: Legacy `referral-check` endpoint must never trigger reward logic.
- N4: Repeated prediction completion for same referee must not duplicate referrer payout.
- N5: Blocked/suspicious referral history must never grant rewards.

## 4. Current Gaps Locked for Phase 2
- Missing direct unit/API tests for `app/api/user/onboarding/route.ts` idempotent lock behavior.
- Missing concurrency-focused tests for `referralService.processReferralSignup` and `grantReferralReward`.
- Missing assertion-level coverage for referral transaction metadata consistency.

## 5. Phase 1 Exit Decision
Phase 1 is complete because:
- Referral flow map is anchored to concrete code paths.
- Risk priorities and required tests are explicitly mapped.
- Reward event/non-event acceptance rules are unambiguous and testable.

Next phase: Phase 2 (`Unit/API Safety Net`).
