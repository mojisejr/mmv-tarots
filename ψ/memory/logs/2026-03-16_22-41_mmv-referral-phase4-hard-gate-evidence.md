# Snapshot: MMV Referral Phase 4 Hard Gate and Sentinel Evidence

**Time**: 2026-03-16 22:41:14 +0700
**Context**: ggg phase 4 for #mmv-referral-manual-balance-fix; verify production-readiness evidence after manual-path reward normalization.

---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-manual-balance-fix"
status: active
tags: [snapshot, phase4, referral, hard-gate, sentinel]
related_files:
  - projects/mmv-tarots/__tests__/e2e/referral-reward-matrix-phase4.test.ts
  - projects/mmv-tarots/__tests__/lib/referral-service-phase2.test.ts
  - projects/mmv-tarots/__tests__/lib/referral-observability.test.ts
  - projects/mmv-tarots/docs/referral-phase4-smoke-checklist.md
  - projects/mmv-tarots/docs/referral-phase5-ops-query-pack.md
---

## Tags
- referral
- hard-gate
- sentinel
- rollout-readiness

## Evidence
- Candidate commit: a15083a
- Hard gate (pass):
  - npm run build
  - npm run lint
  - npx vitest run __tests__/services/first-prediction-reward-service.test.ts __tests__/e2e/referral-reward-matrix-phase4.test.ts __tests__/e2e/referral-reliability-phase3.test.ts __tests__/lib/referral-service-phase2.test.ts __tests__/lib/referral-observability.test.ts
- Targeted suite result: 5 files passed, 25 tests passed.
- Replay confidence run (pass twice consecutively):
  - npx vitest run __tests__/services/first-prediction-reward-service.test.ts __tests__/lib/referral-service-phase2.test.ts __tests__/e2e/referral-reward-matrix-phase4.test.ts
  - Each run result: 3 files passed, 19 tests passed.
- Sentinel SQL counts (staging DB):
  - impossible_combo_rows=0
  - missing_referrer_rows=0
  - duplicate_bonus_rows=0

## Apply When
- ต้องยืนยันว่า rollout candidate ไม่มี impossible combo ระหว่าง LINK source กับ manual referee bonus.
- ต้องการหลักฐานว่า replay/race ยัง idempotent หลัง policy เปลี่ยนสำหรับ MANUAL_CODE path.

## Next Actions
- ส่งต่อ rollout owner เพื่อตัดสิน GO/NO-GO ตาม checklist phase 5.
- ระหว่าง rollout ให้รัน sentinel query ซ้ำตาม window 10%/50%/100%.
