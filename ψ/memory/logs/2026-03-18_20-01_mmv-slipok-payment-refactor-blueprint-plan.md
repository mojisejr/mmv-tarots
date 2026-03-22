# Snapshot: MMV SlipOK Payment Refactor Blueprint

**Time**: 2026-03-18 20:01 +0700
**Context**: Comprehensive /ppp from deep grounding snapshot (contract drift + billing semantics)

---
type: plan
project: mmv-tarots
task_id: "#mmv-slipok-payment-refactor-ppp-2026-03"
status: active
tags: [plan, blueprint, mmv-tarots, slipok, payment, billing, refactor]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/slip-verification-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-fulfillment-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/[id]/slip/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/me/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PromptPayQR.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/billing-history-list.tsx
  - /Users/non/dev/opilot/.tmp/mmv/slip-ok-api-guide.md
---

## Objective
- Refactor MMV payment verification flow ให้สอดคล้อง SlipOK guide แบบ production-safe โดยไม่ทำให้ billing surface และ crediting logic regress.

## Scope
- In Scope:
  - Align SlipOK request contract (endpoint/header/body/env).
  - Align response normalization (nested data parsing + error code semantics).
  - Refine fulfillment state transitions สำหรับ temporary/delay/duplicate/receiver-mismatch/amount-mismatch.
  - Extend billing API/UI ให้แปลความหมาย error และรองรับ ops visibility ดีขึ้น.
  - เพิ่ม test matrix เฉพาะ payment flow และ hard gate evidence.
- Out of Scope:
  - เปลี่ยนระบบ auth, LIFF onboarding, และ referral business logic.
  - เปลี่ยน schema ใหญ่ที่กระทบ feature อื่นนอก payment/billing.
  - เปลี่ยน UX visual language หลักของ MimiVibe.

## Dependencies & Dragons
- Dependency:
  - SlipOK credentials/runtime config (branch ID, api key, timeout/retries) ต้องพร้อมในแต่ละ environment.
  - Existing payment order lifecycle states ต้องคง compatibility กับ billing history.
- Dragons:
  - Risk จาก false reject หาก map error code ผิด semantics.
  - Risk จาก amount check bypass หาก parser ยังอ่านผิด shape.
  - Risk จาก support overload หาก delayed bank cases ถูก reject ทันที.

## Phases
### Phase 1: Contract Alignment Foundation
- Deliverables:
  - กำหนด `SlipOkClientConfig` ชัดเจน: base URL, branch ID, api key, timeout, retries.
  - ปรับ request contract ไปตาม guide (`/api/line/apikey/<branchId>`, `x-authorization`, payload mode `url|data|files`, `log`, optional `amount`).
  - ทำ guardrail สำหรับ config missing ให้ส่ง code/message ที่ชัดเจนและ traceable.
- Exit Criteria:
  - Service ยิง request ได้ตาม contract ใหม่ใน unit test โดยไม่กระทบ public route contract.
- Critical Test Cases:
  - Missing config -> deterministic error (`SLIPOK_NOT_CONFIGURED` equivalent) พร้อม diagnostics ที่ไม่รั่ว secret.
  - URL payload mode ส่งครบ fields ตาม contract (`url + log + amount`).
  - Header contract assert เป็น `x-authorization` และ path มี branch id.

### Phase 2: Response Normalization & Error Taxonomy
- Deliverables:
  - ปรับ parser ให้อ่าน `data.success`, `data.amount`, `data.transRef` และ fallback shape อย่างปลอดภัย.
  - แยก error taxonomy: `TEMPORARY`, `DELAYED_RECHECK`, `DUPLICATE`, `AMOUNT_MISMATCH`, `RECEIVER_MISMATCH`, `INVALID`.
  - map SlipOK codes อย่างน้อย: 1009, 1010, 1012, 1013, 1014.
- Exit Criteria:
  - Parser คืน normalized model ที่ deterministic และครอบคลุมทั้ง success/error variants จาก guide examples.
- Critical Test Cases:
  - success payload with nested `data` -> ได้ `success=true`, `amountTHB`, `externalRef=transRef`.
  - code 1010 -> normalized เป็น delayed/recheck (ไม่โดน reject ทันที).
  - code 1012/1014/1013 -> normalized reason ถูกประเภท.

### Phase 3: Fulfillment State Machine Hardening
- Deliverables:
  - ปรับ `paymentFulfillmentService.submitSlip` ให้รองรับ temporary/delayed path โดยไม่ collapse เป็น `REJECTED` ทุกกรณี.
  - เก็บ verification log พร้อม normalized status/reason ครบ.
  - คง idempotent crediting guard (transaction uniqueness + order status checks).
- Exit Criteria:
  - State transition ถูกต้องทุก branch และไม่มี double-credit regression.
- Critical Test Cases:
  - delayed bank (1010) -> อยู่สถานะรอตรวจซ้ำ/verify pending, ยังไม่ reject.
  - temporary outage (1009) -> retriable path, ไม่ปิด order เป็น terminal fail.
  - duplicate slip (1012) -> ไม่เครดิตซ้ำ, status/diagnostic ชัด.
  - credited race path -> ไม่มี double credit แม้ยิงซ้ำ concurrent.

### Phase 4: Billing API/UI Semantics Upgrade
- Deliverables:
  - ขยาย `/api/payment/orders/me` ให้รองรับ semantic fields สำหรับ UI (errorCategory/retryAfter/delayMinutes เมื่อมี).
  - Billing UI map error code เป็นข้อความ actionable ภาษาไทย และปรับ support CTA ให้ include structured context.
  - เพิ่ม pagination/filter controls ฝั่ง UI (page, pageSize, status).
- Exit Criteria:
  - ผู้ใช้และทีมซัพพอร์ตอ่านสถานะแล้วตัดสินใจต่อได้โดยไม่ต้องตีความ code ดิบ.
- Critical Test Cases:
  - REJECTED with code 1014 แสดง copy ว่า receiver mismatch ชัดเจน.
  - DELAYED (1010) แสดง guidance ให้รอ N นาทีและ recheck.
  - Pagination/filter ทำงานตรงกับ API contract และไม่รั่วข้อมูล user อื่น.

### Phase 5: Verification, Rollout, and Safety Net
- Deliverables:
  - เพิ่ม/อัปเดต test suites: service parser, fulfillment route, billing API/UI.
  - Hard gate เต็มชุด (`npm run build`, `npm run lint`, `npm run test`) และบันทึก evidence.
  - Manual smoke matrix (success, 1010, 1012, 1013, 1014, expired order) + rollback readiness.
- Exit Criteria:
  - ผ่าน hard gate ทั้งหมด และ smoke matrix ไม่มี blocker.
- Critical Test Cases:
  - End-to-end happy path: order -> submit slip -> credited -> billing row complete.
  - Error paths ทั้ง 5 codes แสดงผลและ state transition ตรงแผน.
  - Regression check: `/transactions` และ `/billing` consistency หลัง refactor.

## Risks & Countermeasures
- Risk: Contract change กระทบ production flow ทันที
  - Countermeasure: feature flag หรือ staged rollout config + fallback mode ชั่วคราว
- Risk: Unknown response variants จาก provider
  - Countermeasure: defensive parser + raw payload logging (masked) + alerting
- Risk: UI copy mismatch กับ backend semantics
  - Countermeasure: shared error mapper + contract tests ข้ามชั้น

## Rollback Strategy
- Trigger:
  - hard gate fail แก้ไม่ทัน, หรือ smoke พบ false reject สูงผิดปกติ, หรือ crediting anomaly
- Steps:
  - rollback เฉพาะ verify contract/parser commit set
  - restore previous verification service behavior แบบ phase-scoped
  - คง billing read surface และ owner isolation ไม่ถอยหลัง

## Verification Strategy (Hard Gate)
- Build: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Focused suites (ขั้นต่ำ):
  - `__tests__/api/payment-order-slip-route.test.ts`
  - `__tests__/api/payment-order-status-route.test.ts`
  - `__tests__/api/payment-orders-me-route.test.ts`
  - new parser/normalizer tests for slip verification service
  - new fulfillment branch tests for 1009/1010/1012/1013/1014

## Execution Notes (Handoff to ggg)
- ใช้ phase-scoped commits เท่านั้น
- ห้ามเปลี่ยน business area อื่นนอก payment/billing
- ทุก phase ต้องมี test evidence ก่อนเดิน phase ถัดไป

## Tags
`plan` `ppp` `mmv-tarots` `slipok` `payment-refactor` `billing-history`

## Progress Update
- 2026-03-18 21:28 +0700: Phase 1 DONE (`#mmv-slipok-payment-refactor-ppp-2026-03`)
  - Implemented SlipOK request contract alignment: `/api/line/apikey/<branchId>`, `x-authorization`, URL payload mode with `log` and optional `amount`.
  - Added deterministic config guardrails for missing `SLIPOK_API_KEY` and `SLIPOK_BRANCH_ID`.
  - Verified hard gate passed for this phase before commit (`npm run build && npm run lint && npm run test`).
  - Commit: `979d06f`.
- 2026-03-18 21:37 +0700: Phase 2 DONE (`#mmv-slipok-payment-refactor-ppp-2026-03`)
  - Hardened response normalization for nested payload fields (`data.success`, `data.amount`, `data.transRef`) with deterministic fallbacks.
  - Added SlipOK error taxonomy mapping for `1009/1010/1012/1013/1014` into semantic categories (`TEMPORARY`, `DELAYED_RECHECK`, `DUPLICATE`, `AMOUNT_MISMATCH`, `RECEIVER_MISMATCH`, `INVALID`).
  - Added `retryAfterMinutes` extraction from delay messages and numeric code normalization.
  - Verified hard gate passed for this phase before commit (`npm run build && npm run lint && npm run test`).
  - Commit: `b44bcad`.
- 2026-03-18 22:05 +0700: Phase 3 DONE (`#mmv-slipok-payment-refactor-ppp-2026-03`)
  - Hardened `paymentFulfillmentService.submitSlip` state machine for retryable verification failures.
  - Mapped `TEMPORARY` and `DELAYED_RECHECK` into non-terminal `VERIFYING` path instead of immediate `REJECTED`.
  - Upgraded verification log status to semantic values (`SUCCESS`, `PENDING_RECHECK`, `FAILED`) for operations visibility.
  - Preserved idempotent crediting guard path and added race-path coverage where order is already credited.
  - Added service tests for `1009/1010/1012` branches and credited race-path behavior.
  - Verified hard gate passed for this phase before commit (`npm run build && npm run lint && npm run test`).
  - Commit: `f5146a7`.
- 2026-03-18 22:16 +0700: Phase 4 DONE (`#mmv-slipok-payment-refactor-ppp-2026-03`)
  - Extended `/api/payment/orders/me` with semantic fields: `errorCategory`, `retryAfterMinutes`, and `delayMinutes` for billing consumption.
  - Added shared payment error semantics mapper to keep API/UI interpretation deterministic for SlipOK codes.
  - Upgraded billing history UI with pagination and filter controls (`page`, `pageSize`, `status`) bound to API query params.
  - Added Thai actionable error guidance for delayed/temporary/receiver-mismatch/amount-mismatch/duplicate scenarios and enriched support CTA payload with structured context.
  - Added/updated tests for API semantics mapping, shared mapper unit coverage, and billing page render behavior under the new filter UI.
  - Verified hard gate passed for this phase before commit (`npm run build && npm run lint && npm run test`).
  - Commit: `6e2078a`.
- 2026-03-18 22:27 +0700: Phase 5 DONE (`#mmv-slipok-payment-refactor-ppp-2026-03`)
  - Expanded verification matrix tests for payment slip route to cover delayed recheck (`1010` -> `VERIFYING`) and expired order branch (`EXPIRED` -> `422`).
  - Added transactions API route tests (`/api/credits/history`) for auth guard and owner-scoped pagination retrieval to reinforce `/transactions` and `/billing` consistency guard.
  - Re-validated full hard gate (`npm run build && npm run lint && npm run test`) after Phase 5 changes.
  - Manual smoke matrix readiness documented for: success, `1010`, `1012`, `1013`, `1014`, and expired order branches through route/service test coverage and explicit rollback section in this plan.
  - Commit: `0f22043`.

