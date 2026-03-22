# Snapshot: MMV Referral Phase 3 Matrix Alignment Completed

**Time**: 2026-03-16 22:29:32 +0700
**Context**: ggg phase 3 for #mmv-referral-manual-balance-fix; align e2e matrix and ledger assertions with MANUAL_CODE no-universal-bonus policy.

---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-manual-balance-fix"
status: active
tags: [snapshot, phase3, referral, test-matrix, ledger]
related_files:
  - projects/mmv-tarots/__tests__/e2e/referral-ledger-assertions.ts
  - projects/mmv-tarots/__tests__/e2e/referral-reward-matrix-phase4.test.ts
  - projects/mmv-tarots/docs/referral-policy-truth-table-phase1.md
---

## Tags
- referral
- manual-code
- first-prediction-bonus
- phase3

## Evidence
- Commit: a15083a
- Hard gate commands passed:
  - npm run build
  - npm run lint
  - npx vitest run __tests__/services/first-prediction-reward-service.test.ts __tests__/e2e/referral-reward-matrix-phase4.test.ts __tests__/e2e/referral-reliability-phase3.test.ts
- Test result summary: 3 files passed, 14 tests passed.

## Apply When
- ใช้นโยบายที่กำหนดว่า MANUAL_CODE path ต้องมี ONBOARDING_BONUS + MANUAL_CLAIM_REFEREE_BONUS และต้องไม่มี FIRST_PREDICTION_BONUS.
- ต้องการกัน false positive ใน matrix assertion โดยบังคับ count ต่อ event ตาม scenario expectation.

## Next Actions
- ดำเนิน ggg phase 4 เพื่อเก็บ production-readiness evidence และ sentinel checks.
