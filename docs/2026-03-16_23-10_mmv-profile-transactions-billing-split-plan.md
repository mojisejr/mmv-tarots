# Snapshot: MMV Profile Split + Transactions/Billing Blueprint

**Time**: 2026-03-16 23:10 +0700
**Context**: Deep grounding from profile tabs, dual-ledger model, PaymentOrder+SlipOK lifecycle

---
type: plan
project: mmv-tarots
task_id: "#mmv-profile-transactions-billing-split"
status: active
tags: [plan, blueprint, profile, transactions, billing, slipok]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/app/profile/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/history/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/transaction-history-list.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/credits/history/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/[id]/status/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/[id]/slip/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-fulfillment-service.ts
---

## Objective
- แยก Profile เป็น account hub และย้ายประวัติเป็น 2 surface ชัดเจน: Transactions (credit ledger) + Billing History (payment lifecycle) เพื่อให้ผู้ใช้ตรวจสอบได้ครบว่าเติมแพ็กไหน เวลาใด เครดิตเข้าหรือยัง และมี error อะไร

## Scope
- In Scope:
  - เอาแท็บ Predictions/Transactions ออกจาก profile
  - คง prediction history ที่ /history เป็นแหล่งเดียว
  - สร้าง /transactions page
  - สร้าง /billing page
  - เพิ่ม API `GET /api/payment/orders/me`
  - รักษา visual/theme เดิมของ MimiVibe
  - เพิ่ม test ที่จำเป็นต่อ route/API ใหม่
- Out of Scope:
  - เปลี่ยน payment protocol (ยังใช้ PromptPay + SlipOK)
  - refactor core credit fulfillment logic
  - เปลี่ยน bottom nav architecture ใหญ่

## Architecture Alignment Notes
- Payment truth source = PaymentOrder state machine
- Wallet movement source = CreditTransaction
- แผนนี้ใช้ dual-ledger separation:
  - /transactions = wallet-centric
  - /billing = payment-centric
- จุดประสงค์คือแก้ ambiguity โดยไม่แตะ business core ที่ stable อยู่แล้ว

## Phases

### Phase 1: Profile IA Refactor
- Deliverables:
  - ลบ tab state/UI ใน app/profile/page.tsx
  - ลบ in-profile recent predictions/transaction list
  - เพิ่ม quick links ไป /transactions และ /billing
  - คง wallet/referral/support/legal/signout section
- Exit Criteria:
  - profile ไม่มี tabs เดิม
  - referral/support flow ไม่ regress
- Critical Test Cases:
  - render profile แล้วไม่พบ Predictions/Transactions tabs
  - support modal เปิด-ส่งได้
  - referral copy/claim ยังผ่าน

### Phase 2: Transactions Surface
- Deliverables:
  - สร้าง app/transactions/page.tsx
  - แสดงข้อมูลจาก /api/credits/history แบบ standalone
  - loading/empty/error states ตาม pattern เดิม
  - update navigation page typing ให้รองรับ route ใหม่
- Exit Criteria:
  - เปิด /transactions แล้วได้ข้อมูลเทียบเท่า profile tab เดิม
- Critical Test Cases:
  - authenticated user เห็นรายการ
  - empty state ถูกต้อง
  - unauthorized handling ถูกต้องตาม app pattern

### Phase 3: Billing API Contract
- Deliverables:
  - เพิ่ม GET /api/payment/orders/me (pagination + status filter)
  - คืนข้อมูล: order/ref, package, amount, status, createdAt, verifiedAt, creditedAt, verificationErrorCode/message, credited transaction summary
  - enforce owner isolation
  - แนบ latest verification log summary เมื่อมี
- Exit Criteria:
  - endpoint มี schema deterministic และปลอดภัย
- Critical Test Cases:
  - owner list ได้เฉพาะ order ของตัวเอง
  - unauth = 401
  - CREDITED/REJECTED/EXPIRED fields ครบ

### Phase 4: Billing UI Surface
- Deliverables:
  - สร้าง app/billing/page.tsx
  - แสดง billing rows พร้อม status chips + timestamps + errors
  - กรณี failed/stuck มี support CTA พร้อม prefilled context
- Exit Criteria:
  - ผู้ใช้ตรวจสอบเส้นทางเติมเครดิตครบได้จาก UI
- Critical Test Cases:
  - CREDITED แสดง creditedAt ถูกต้อง
  - REJECTED/EXPIRED แสดง reason + support CTA
  - VERIFYING/PENDING แสดง in-progress state ถูกต้อง

### Phase 5: Hard Gate + Rollout
- Deliverables:
  - เพิ่ม tests สำหรับ API ใหม่
  - รัน hard gate: build/lint/test
  - manual smoke checklist: profile links, transactions, billing, payment modal continuity
- Exit Criteria:
  - build/lint/test ผ่าน
  - เส้นทาง "เติมแล้วไม่ได้" ตรวจสอบได้ครบ
- Critical Test Cases:
  - /profile -> /billing ใช้งานได้
  - payment modal flow ไม่ regress
  - /history ยังเป็น prediction source เดียว

## Risks & Countermeasures
- Risk: ผู้ใช้สับสนระหว่าง transactions กับ billing
  - Countermeasure: แยก naming/copywriting และ section headers ชัดเจน
- Risk: route typing regression
  - Countermeasure: update PageType + pathname sync checks
- Risk: billing history ข้อมูลเยอะโหลดช้า
  - Countermeasure: server pagination defaults + incremental loading

## Rollback Strategy
- Trigger:
  - hard gate fail ที่แก้ไม่ทัน หรือพบ data exposure risk
- Steps:
  - revert `/transactions`, `/billing`, `/api/payment/orders/me`
  - restore profile navigation shortcuts แบบก่อนรอบนี้
  - ไม่แตะ payment fulfillment core

## Verification Strategy
- Build: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Focused suites:
  - __tests__/api/payment-orders-route.test.ts
  - __tests__/api/payment-order-status-route.test.ts
  - __tests__/api/payment-order-slip-route.test.ts
  - __tests__/api/payment-orders-me-route.test.ts (new)

## Handoff to Implementer (ggg)
- Execute phase-by-phase with phase-scoped commits.
- Preserve existing MimiVibe primitives (GlassCard, GlassButton, status chips).
- Avoid touching crediting algorithm unless failing tests force change.

## Tags
`plan` `mmv-tarots` `profile-refactor` `transactions` `billing-history` `slipok`

---

## Phase Execution Update (2026-03-17 21:39 +0700)
- Phase 1 status: DONE
- Commit: `f927af6` (`feat(profile): #mmv-profile-transactions-billing-split phase1 account hub IA refactor`)
- Completed:
  - Removed in-profile Predictions/Transactions tabs and legacy tab state from `app/profile/page.tsx`
  - Removed in-profile recent predictions/transactions sections
  - Added account hub quick links to `/history`, `/transactions`, `/billing`
  - Preserved wallet, referral, support, legal, sign out sections
  - Added regression test `__tests__/app/profile-page-phase1.test.tsx`
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (39 files, 203 tests)

## Phase Execution Update (2026-03-17 22:03 +0700)
- Phase 2 status: DONE
- Commit: `42fc9b3` (`feat(transactions): #mmv-profile-transactions-billing-split phase2 standalone surface`)
- Completed:
  - Added standalone transactions surface at `app/transactions/page.tsx`
  - Wired `/transactions` into navigation state typing and pathname sync
  - Updated navbar title/main-page handling for `transactions`
  - Expanded transaction list mapping for `REFERRAL` and `ONBOARDING` entries with explicit error state
  - Added regression test `__tests__/app/transactions-page-phase2.test.tsx`
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (40 files, 206 tests)

## Phase Execution Update (2026-03-17 22:28 +0700)
- Phase 3 status: DONE
- Commit: `369af9a` (`feat(billing-api): #mmv-profile-transactions-billing-split phase3 orders-me contract`)
- Completed:
  - Added `GET /api/payment/orders/me` at `app/api/payment/orders/me/route.ts`
  - Implemented pagination (`page`, `pageSize`) and optional status filter (`status=CREDITED,REJECTED,...`)
  - Enforced strict owner isolation via `where.userId = session.user.id`
  - Returned deterministic billing payload with package summary, credited transaction summary, and latest verification log summary
  - Added regression test `__tests__/api/payment-orders-me-route.test.ts`
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (41 files, 209 tests)

## Phase Execution Update (2026-03-17 22:47 +0700)
- Phase 4 status: DONE
- Commit: `df1420b` (`feat(billing): #mmv-profile-transactions-billing-split phase4 billing surface`)
- Completed:
  - Added standalone billing surface at `app/billing/page.tsx`
  - Added `BillingHistoryList` at `components/features/billing-history-list.tsx` with payment status chips, timestamp fields, and verification error details
  - Added support CTA for `REJECTED`/`EXPIRED`/`VERIFYING` states with prefilled `mailto` context
  - Wired `/billing` into navigation state typing and pathname sync
  - Updated navbar title and main-page handling for `billing`
  - Added regression test `__tests__/app/billing-page-phase4.test.tsx`
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (42 files, 212 tests)

## Phase Execution Update (2026-03-18 07:38 +0700)
- Phase 5 status: DONE
- Commit: `9c8b6be` (`docs(rollout): #mmv-profile-transactions-billing-split phase5 hard-gate checklist`)
- Completed:
  - Ran hard gate in target repo (`npm run build`, `npm run lint`, `npm run test`) with PASS across all gates
  - Added rollout evidence checklist at `docs/mmv-profile-phase5-rollout-checklist.md`
  - Confirmed regression coverage for `/profile -> /billing`, billing surface behavior, payment lifecycle API routes, and `/history` continuity
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (42 files, 212 tests)

## Phase Execution Update (2026-03-18 08:13 +0700)
- Phase 5 status: DONE (desktop topnav exposure follow-up)
- Completed:
  - Added `Transactions` and `Billing` shortcuts to desktop top navigation user menu (`components/layout/profile-dropdown.tsx`)
  - Kept mobile navigation unchanged per rollout decision (desktop-only)
  - Preserved existing `/transactions` and `/billing` route wiring without changing payment/business logic
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (42 files, 212 tests)

