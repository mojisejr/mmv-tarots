---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-semantic-refactor"
status: active
tags: [snapshot, phase4, referral, e2e, matrix]
related_files:
  - projects/mmv-tarots/__tests__/e2e/referral-ledger-assertions.ts
  - projects/mmv-tarots/__tests__/e2e/referral-reward-matrix-phase4.test.ts
  - projects/mmv-tarots/__tests__/lib/referral-service-phase2.test.ts
  - projects/mmv-tarots/__tests__/app/cards-import.test.ts
---

# Snapshot: MMV Phase 4 Reward Matrix Expansion

**Time**: 2026-03-15 13:30:46 +0700  
**Context**: Completed phase 4 by expanding reward-path verification coverage to truth-table matrix scenarios, parity checks, and replay/race safety assertions.

## Evidence
- Added reusable DB/ledger verification helper for phase matrix assertions:
  - `assertScenarioLedger(scenarioId, entries)` validates totals/events/idempotency boundaries.
- Added Phase 4 E2E matrix test surface:
  - Scenarios S0-S4 totals match frozen truth-table contract.
  - Replay gate runs matrix validation twice for deterministic outcomes.
  - Manual claim deny-case (link-attributed user) remains enforced.
- Added LIFF/web attribution parity checks:
  - Both `share` and `liff` ref entries capture first-touch `mmv_ref`.
  - Existing cookie prevents overwrite on reopen in both entry paths.
- Added replay/race guard assertion on referral payout claim transition:
  - If `PENDING_FIRST_PREDICTION -> GRANTED` claim was already taken by concurrent worker, payout is skipped.
- Stabilized import-heavy legacy tests with explicit timeout contracts to avoid flaky hard-gate failures.

## Verification
- `npm run build` PASS
- `npm run lint` PASS
- `npm run test` PASS (`37` files, `193` tests)
- Commit: `36e05ef`

## Apply When
- Expanding policy-sensitive reward logic where payout totals must exactly match product truth table.
- Needing confidence that first-touch attribution behavior remains consistent across web and LIFF entrances.
- Requiring deterministic replay checks before moving to rollout guardrails.

## Next Actions
- Start Phase 5: telemetry hooks, anomaly rules, and rollout checklist with kill-switch instructions.
- Produce scenario evidence table consumable for go/no-go review.

## Tags
`snapshot` `phase4` `mmv-tarots` `reward-matrix` `replay-gate` `liff-parity`
