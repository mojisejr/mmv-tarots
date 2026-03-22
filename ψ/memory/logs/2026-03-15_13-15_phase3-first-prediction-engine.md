---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-semantic-refactor"
status: active
tags: [snapshot, phase3, referral, reward-engine]
related_files:
  - projects/mmv-tarots/lib/server/services/first-prediction-reward-service.ts
  - projects/mmv-tarots/lib/server/services/referral-service.ts
  - projects/mmv-tarots/services/tarot-service.ts
  - projects/mmv-tarots/lib/server/workflows/simple-tarot.ts
  - projects/mmv-tarots/__tests__/services/first-prediction-reward-service.test.ts
  - projects/mmv-tarots/__tests__/lib/referral-service-phase2.test.ts
---

# Snapshot: MMV Phase 3 First-Prediction Reward Engine

**Time**: 2026-03-15 13:15:19 +0700  
**Context**: Implemented phase 3 to consolidate first-successful-prediction rewards into one source-aware engine with idempotency and replay safety.

## Evidence
- New single engine: `firstPredictionRewardService.processFirstSuccessfulPrediction(userId)`.
- Universal `FIRST_PREDICTION_BONUS (+1)` now granted with deterministic idempotency key:
  - `externalRef = first_prediction_bonus:<userId>`
- Referral payout now source-aware at first successful prediction:
  - Referrer gets `+2` for valid entitlement.
  - Referee gets `+2` only when `source = MANUAL_CODE`.
  - `LINK` source does not receive manual-claim referee bonus.
- Concurrency guard improved by conditional state transition claim:
  - `updateMany` from `PENDING_FIRST_PREDICTION` to `GRANTED` inside transaction.
- Workflows now call one central engine:
  - `services/tarot-service.ts`
  - `lib/server/workflows/simple-tarot.ts`

## Verification
- `npm run build` PASS
- `npm run lint` PASS
- `npm run test` PASS (`36` files, `188` tests)
- Commit: `30b104c`

## Apply When
- Reward logic is distributed between prediction completion points and risks semantic drift.
- You need replay-safe payout behavior across async workflow retries.
- Policy requires source-aware referral payout differences (`LINK` vs `MANUAL_CODE`).

## Next Actions
- Execute Phase 4 e2e matrix expansion for reward-path totals and replay race scenarios.
- Add scenario evidence table mapping truth-table paths to final ledger totals.

## Tags
`snapshot` `phase3` `mmv-tarots` `referral` `first-prediction` `idempotency`
