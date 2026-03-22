# Snapshot: MMV Referral Manual Balance Normalization Blueprint

**Time**: 2026-03-16 21:50 +0700
**Context**: Align manual and link referral end-state to 2 stars after first successful prediction

---
type: plan
project: mmv-tarots
task_id: "#mmv-referral-manual-balance-fix"
status: active
tags: [plan, blueprint, referral, reward-policy]
related_files:
  - projects/mmv-tarots/lib/server/services/first-prediction-reward-service.ts
  - projects/mmv-tarots/lib/server/services/referral-service.ts
  - projects/mmv-tarots/lib/server/services/referral-claim-service.ts
  - projects/mmv-tarots/lib/server/services/onboarding-orchestration-service.ts
  - projects/mmv-tarots/services/tarot-service.ts
  - projects/mmv-tarots/__tests__/services/first-prediction-reward-service.test.ts
  - projects/mmv-tarots/__tests__/e2e/referral-reward-matrix-phase4.test.ts
  - projects/mmv-tarots/__tests__/e2e/referral-ledger-assertions.ts
  - projects/mmv-tarots/docs/referral-policy-truth-table-phase1.md
  - projects/mmv-tarots/docs/referral-phase4-smoke-checklist.md
---

## Objective & Scope
- Objective:
  - ปรับนโยบาย reward ให้ผลลัพธ์สุดท้ายของผู้ใช้ใหม่ที่ใช้ referral ทั้ง LINK และ MANUAL_CODE หลังถามครั้งแรกแล้วคงเหลือ 2 stars เท่ากัน
  - คงเงื่อนไขธุรกิจ: โบนัส referral จะ unlock หลัง first successful prediction เท่านั้น
- In Scope:
  - ปรับ source-aware orchestration ใน first prediction reward flow
  - ปรับสัญญา policy docs + test matrix + ledger assertions ให้ตรงกติกาใหม่
  - รักษา idempotency และ anti-duplication สำหรับ replay/race
- Out of Scope:
  - เปลี่ยน amount ฝั่ง referrer (ยังคง +2)
  - เปลี่ยน onboarding flow ฝั่ง auth/LIFF
  - migration schema

## Current-State Diagnosis (Grounded)
- ตอนนี้ MANUAL_CODE ได้ 2 ชั้นพร้อมกันที่ first prediction:
  - Universal FIRST_PREDICTION_BONUS +1
  - MANUAL_CLAIM_REFEREE_BONUS +2
- ทำให้เส้นทาง MANUAL_CODE เป็น +1 (onboarding) -1 (prediction) +1 +2 = เหลือ 3
- สเปกและเทสปัจจุบันล็อกพฤติกรรมนี้ไว้ จึงต้องเปลี่ยนทั้ง implementation + contract พร้อมกัน

## Target Policy (Post-Refactor)
- S1 LINK:
  - ก่อนถาม: +1 onboarding +1 link onboarding = 2
  - หลังถามครั้งแรก: -1 prediction +1 first prediction = 2
- S2/S3 MANUAL_CODE:
  - ก่อนถาม: +1 onboarding = 1
  - หลังถามครั้งแรก: -1 prediction +2 manual claim referee = 2
  - ไม่มี universal +1 สำหรับ MANUAL_CODE path
- Referrer:
  - ได้ +2 เมื่อ referee ผ่าน first successful prediction ตามเดิม

## Phase Plan

### Phase 1: Policy Contract Realignment
- Deliverables:
  - อัปเดต truth table ให้ MANUAL_CODE ไม่รับ FIRST_PREDICTION_BONUS
  - อัปเดต smoke checklist สำหรับ expected ledger ของ MANUAL_CODE
  - นิยาม invariant ใหม่: first-prediction universal bonus applies only to NONE/LINK
- Exit Criteria:
  - เอกสาร policy และ checklist สอดคล้องกับผลลัพธ์ target (LINK=2, MANUAL_CODE=2 หลังถามครั้งแรก)
  - ไม่มีข้อความเอกสารที่บอกว่า MANUAL_CODE ต้องได้ +1 universal
- Critical Test Cases (Design-time):
  - Scenario S1 expected referee final total = 2 หลังถามครั้งแรก
  - Scenario S3 expected referee final total = 2 หลังถามครั้งแรก

### Phase 2: Source-Aware Reward Orchestration Refactor
- Deliverables:
  - ปรับ first-prediction reward service ให้ query pending referral entitlement source ก่อนแจกโบนัส universal
  - Branching rule:
    - source=MANUAL_CODE: skip universal +1, เรียก referral payout เท่านั้น
    - source=LINK หรือ no-pending-history: ให้ universal +1 ตามเดิม
  - คง idempotency externalRef และ unique constraint handling
- Exit Criteria:
  - โค้ดไม่สามารถสร้างทั้ง first_prediction_bonus:* และ manual_claim_referee_bonus:* ให้ user เดียวกันใน first-prediction event เดียวกัน (manual path)
  - Replay callback ยังไม่ทำให้จ่ายซ้ำ
- Critical Test Cases:
  - first-prediction service: MANUAL_CODE path ต้องไม่สร้าง FIRST_PREDICTION_BONUS transaction
  - first-prediction service: LINK path ยังสร้าง FIRST_PREDICTION_BONUS transaction ได้ 1 ครั้ง
  - race simulation: unique constraint/replay แล้ว ledger ไม่เกิน expected

### Phase 3: Test Matrix and Regression Update
- Deliverables:
  - ปรับ e2e reward matrix (S0-S4) ให้ expected totals ใหม่
  - ปรับ ledger assertion helper ให้รองรับ expected totals แบบใหม่โดยไม่เปิดช่อง false positive
  - เพิ่ม targeted unit/integration tests ใน first-prediction service สำหรับ source-aware branching
- Exit Criteria:
  - Test contract ไม่ขัดกับ policy docs
  - ครอบคลุม deny-case เดิม: link-attributed ห้าม manual claim และ duplicate claim = 409
- Critical Test Cases:
  - S2/S3 MANUAL_CODE ledger ต้องมี ONBOARDING_BONUS + MANUAL_CLAIM_REFEREE_BONUS (ไม่มี FIRST_PREDICTION_BONUS)
  - S1 LINK ledger ต้องมี ONBOARDING_BONUS + LINK_ONBOARDING_BONUS + FIRST_PREDICTION_BONUS

### Phase 4: Hard Gate + Production Readiness Evidence
- Deliverables:
  - รัน hard gate เต็มชุด: build, lint, targeted tests และ full relevant matrix
  - เก็บ evidence command outputs ที่อ้างอิง smoke checklist และ ops query pack
  - ตรวจ query sentinel ว่าไม่พบ impossible combo ใหม่
- Exit Criteria:
  - Build/Lint/Test ผ่านทั้งหมด
  - Ledger จาก smoke run ตรง policy ใหม่ (manual final balance 2)
- Critical Test Cases:
  - Manual end-to-end replay 2 รอบ: ไม่มี duplicate payout
  - LINK path unaffected regression

## Risks and Rollback Strategy
- Risk 1: กระทบผู้ใช้ที่ไม่มี referral (NONE) เพราะ branching ผิด
  - Mitigation: guard เฉพาะเมื่อพบ pending MANUAL_CODE history เท่านั้น
- Risk 2: idempotency แตกจากการ reorder flow
  - Mitigation: คง externalRef + unique constraints เดิม และเพิ่ม replay test
- Risk 3: docs/test drift หลังแก้ logic
  - Mitigation: บังคับแก้ policy doc + matrix ใน PR เดียวกัน

### Rollback Plan
- Trigger:
  - พบว่า LINK หรือ NONE ไม่ได้ FIRST_PREDICTION_BONUS ตาม expected
  - พบ sentinel anomaly ใน production logs
- Steps:
  1. revert commit ชุด policy refactor กลับ baseline ก่อนหน้า
  2. เปิด temporary kill-switch เฉพาะ reward engine หากจำเป็น
  3. ใช้ ops query pack ตรวจความเสียหายของ ledger และทำ manual correction ตามกรณี

## Verification Strategy (Hard Gate)
- Build:
  - npm run build
- Lint:
  - npm run lint
- Tests (minimum gate):
  - npx vitest run __tests__/services/first-prediction-reward-service.test.ts
  - npx vitest run __tests__/e2e/referral-reward-matrix-phase4.test.ts
  - npx vitest run __tests__/e2e/referral-reliability-phase3.test.ts
- Optional confidence suite:
  - npm run test
- Runtime smoke evidence:
  - ทำ manual claim flow ตาม checklist และยืนยัน ledger sequence ว่า final referee balance = 2

## Handoff Notes
- โหมดถัดไป: @oracle-implementer (Soldier Mode)
- คำสั่งเริ่มแนะนำ: ggg phase 1 -> phase 2 -> phase 3 -> phase 4

## Execution Update
- 2026-03-16 22:13:14 +0700: Phase 1 (Policy Contract Realignment) DONE
  - Updated `referral-policy-truth-table-phase1.md` to enforce MANUAL_CODE no universal first-prediction bonus.
  - Updated `referral-phase4-smoke-checklist.md` to assert net referee balance = 2 for LINK and MANUAL_CODE after first successful prediction.
  - Hard gate passed in target repo before commit: build, lint, targeted tests.
  - Commit: `f245a65` on `projects/mmv-tarots` (`staging`).
- 2026-03-16 22:21:10 +0700: Phase 2 (Source-Aware Reward Orchestration Refactor) DONE
  - Added referral source lookup in reward pipeline to detect MANUAL_CODE attribution before universal first-prediction bonus.
  - Updated first-prediction flow to skip universal bonus for MANUAL_CODE and still execute referral payout path.
  - Added unit coverage for manual-source skip branch and kill-switch behavior with source lookup gating.
  - Hard gate passed in target repo: build, lint, targeted tests.
  - Commit: `1407ab5` on `projects/mmv-tarots` (`staging`).

- 2026-03-16 22:27:49 +0700: Phase 3 (Test Matrix and Regression Update) DONE
  - Updated e2e matrix fixture to remove `FIRST_PREDICTION_BONUS` from MANUAL_CODE scenarios (S2/S3).
  - Updated ledger assertion helper to enforce scenario-aware event counts (manual path must have zero universal first-prediction bonus).
  - Hard gate passed in target repo: build, lint, targeted tests.
  - Commit: `a15083a` on `projects/mmv-tarots` (`staging`).

- 2026-03-16 22:40:52 +0700: Phase 4 (Hard Gate + Production Readiness Evidence) DONE
  - Hard gate passed in target repo: `npm run build`, `npm run lint`, and targeted referral suites (25/25 passed).
  - Critical replay subset passed twice consecutively: `first-prediction-reward-service`, `referral-service-phase2`, `referral-reward-matrix-phase4` (19/19 each run).
  - Ops query pack sentinel checks passed on staging DB with corrected physical table names:
    - `impossible_combo_rows=0`
    - `missing_referrer_rows=0`
    - `duplicate_bonus_rows=0`
  - No additional code changes required in target repo after phase 3 commit baseline `a15083a`.
