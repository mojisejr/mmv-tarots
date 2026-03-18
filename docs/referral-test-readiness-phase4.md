# MMV Referral Test Readiness - Phase 4 Pre-Refactor Gate

Plan Ref: `#mmv-referral-test-first-readiness`
Status: `DONE (Phase 4)`
Date: `2026-03-15`

## Objective
Consolidate evidence from Phases 1-3, validate deterministic replay behavior, and decide go/no-go for behavior-changing referral refactor.

## 1. Evidence Summary (Proven vs Uncertain)

### Proven
- Referral attribution first-touch contract is stable.
  - Coverage: `__tests__/middleware.test.ts`, `__tests__/e2e/referral-reliability-phase3.test.ts`.
  - Result: `mmv_ref` is captured once and not overwritten by later links.

- Manual referral claim is guarded and deterministic.
  - Coverage: `__tests__/api/referral-claim-route.test.ts`, `__tests__/e2e/referral-reliability-phase3.test.ts`.
  - Result: self/invalid/already-claimed/late claim paths are rejected; eligible claim links correctly.

- Onboarding gate enforces single reward ownership.
  - Coverage: `__tests__/api/onboarding-route.test.ts`, `__tests__/services/credit-service-phase2.test.ts`.
  - Result: onboarding bonus and referral-entry bonus are idempotent with replay protection.

- Referral recording and payout paths have branch-level safety net.
  - Coverage: `__tests__/lib/referral-service-phase2.test.ts`.
  - Result: `processReferralSignup` idempotency and `grantReferralReward` ledger semantics are enforced.

- Legacy referral-check path is side-effect safe.
  - Coverage: `__tests__/api/referral-check-route.test.ts`, `__tests__/e2e/referral-reliability-phase3.test.ts`.
  - Result: endpoint remains explicit no-op and cannot trigger reward effects.

### Still Uncertain
- Real LIFF/session timing behavior in production network conditions.
  - Reason: current E2E is deterministic and mock-oriented.

- True database-level concurrency under multi-worker runtime.
  - Reason: tests validate app-level idempotency but not high-contention production races.

- End-to-end payout observability from first prediction callback to persisted DB rows in production infra.
  - Reason: suite validates contract behavior but does not include production telemetry replay.

## 2. Gate Replay Results (Non-Determinism Check)

Critical subset command (run twice):

```bash
cd /Users/non/dev/opilot/projects/mmv-tarots && npx vitest run \
  __tests__/api/referral-check-route.test.ts \
  __tests__/api/referral-claim-route.test.ts \
  __tests__/api/onboarding-route.test.ts \
  __tests__/lib/referral-service-phase2.test.ts \
  __tests__/services/credit-service-phase2.test.ts \
  __tests__/middleware.test.ts \
  __tests__/e2e/referral-reliability-phase3.test.ts
```

| Replay Run | Test Files | Tests | Result |
|---|---:|---:|---|
| Run #1 | 7 | 37 | PASS |
| Run #2 | 7 | 37 | PASS |

Conclusion: no observed non-determinism in referral critical subset during local replay gate.

## 3. Regression Sentinel

Hard Gate full suite:

- Build: PASS (`npm run build`)
- Lint: PASS (`npm run lint`)
- Test: PASS (`npm run test`)
- Final suite result: `32 files, 178 tests` all passing

Conclusion: existing referral tests remained green after Phase 3 additions.

## 4. Refactor Readiness Checklist

- [x] Referral lifecycle baseline truth documented (Phase 1)
- [x] Unit/API idempotency safety net in place (Phase 2)
- [x] E2E reliability lifecycle scenarios added (Phase 3)
- [x] Critical subset replayed twice with consistent pass
- [x] Full hard gate passed after replay
- [x] Consolidated evidence report produced
- [ ] Human approval received for behavior-changing refactor

## 5. Draft Refactor Targets (Prioritized)

### Priority 1 - High Impact / High Risk
- `lib/server/services/referral-service.ts`
- Goal: separate state transition logic from persistence calls, add explicit transition guard helpers, preserve current reward semantics.

### Priority 2 - High Impact / Medium Risk
- `app/api/user/onboarding/route.ts`
- Goal: isolate ritual gate orchestration into pure service function and keep route as thin transport layer.

### Priority 3 - Medium Impact / Medium Risk
- `services/tarot-service.ts`
- Goal: move referral reward trigger into a dedicated post-completion hook with explicit idempotent guard boundary.

### Priority 4 - Medium Impact / Low Risk
- `app/api/user/referral-claim/route.ts`
- Goal: normalize validation order and error contract mapping for easier future provider expansion.

## 6. Decision

Go/No-Go: `GO (with constraints)`

Constraints:
- Do not change business behavior in first refactor slice.
- Preserve all current test assertions as migration contract.
- Keep legacy referral-check endpoint as strict no-op.
- Require hard gate pass on every refactor slice.
