---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-manual-balance-fix"
status: active
tags: [snapshot, phase1, referral, reward-policy]
related_files:
  - projects/mmv-tarots/docs/referral-policy-truth-table-phase1.md
  - projects/mmv-tarots/docs/referral-phase4-smoke-checklist.md
---

# Snapshot: MMV Referral Phase 1 Policy Contract Realignment

**Time**: 2026-03-16 22:13:14 +0700
**Context**: Execute `ggg phase 1` to normalize manual/link referee end-state to 2 stars after first successful prediction.

## Tags
- phase1
- referral-policy
- manual-code
- hard-gate-passed

## Evidence
- Updated contract file to enforce MANUAL_CODE path does not receive universal `FIRST_PREDICTION_BONUS`.
- Updated smoke checklist to assert referee net balance = 2 for both LINK and MANUAL_CODE after first successful prediction.
- Hard gate commands passed in target repo:
  - `npm run build`
  - `npm run lint`
  - `npx vitest run __tests__/services/first-prediction-reward-service.test.ts`
  - `npx vitest run __tests__/e2e/referral-reward-matrix-phase4.test.ts`
  - `npx vitest run __tests__/e2e/referral-reliability-phase3.test.ts`
- Project-scoped commit created: `f245a65`

## Apply When
- Referral policy requires LINK and MANUAL_CODE to converge at same post-first-prediction referee balance.
- Documentation contract must be realigned before source-aware orchestration changes in service layer.

## Next Actions
- Run `ggg phase 2` to implement source-aware first-prediction orchestration.
- Add targeted tests for manual path no-universal-bonus branch in service layer.
- Keep policy docs and test matrix in same PR to prevent contract drift.
