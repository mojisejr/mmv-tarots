# Snapshot: MMV Tarots Single-Draft Payment Order Reuse Blueprint

**Time**: 2026-03-20 08:58 +0700
**Context**: Detailed /ppp for option 3: keep one reusable draft payment order per purchase journey so users do not see duplicate waiting/paid orders for a single payment attempt

---
type: plan
project: mmv-tarots
task_id: "#mmv-single-draft-reuse-payment-order-ppp-2026-03"
status: active
tags: [plan, blueprint, mmv-tarots, payment, billing, order-reuse, draft-revival]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-order-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-fulfillment-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/me/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/billing-history-list.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/package/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/api/payment-orders-route.test.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/api/payment-orders-me-route.test.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/services/payment-fulfillment-service.test.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/api/payment-order-slip-route.test.ts
---

## Objective
- เปลี่ยน payment-flow semantics ให้ 1 purchase journey มี draft payment order เพียง 1 row ที่ถูก reuse/revive ได้ จนกว่าจะถูกส่งสลิปและเข้าสู่ verification/credited path
- ลดความสับสนบน billing UX ว่า "จ่ายครั้งเดียวแต่มี 2 order" โดยไม่รื้อ domain เป็น PaymentIntent ใหม่ในรอบนี้
- รักษา credit ledger, slip verification, support escalation, receipt flow, และ existing payment-aftercare contracts ให้กระทบน้อยที่สุด

## Scope
- In Scope:
  - ปรับ creation policy ของ `/api/payment/orders` ให้หาและ revive latest reusable draft ก่อน create ใหม่
  - นิยาม reusable draft ให้ชัดใน service layer โดยแยก draft-no-slip ออกจาก orders ที่มี slip evidence แล้ว
  - คง order row เดิมเมื่อ user กลับมาเปิด QR ใหม่หลัง expired/no-payment เพื่อไม่ให้เกิด duplicate pending rows
  - ทบทวน billing surface ให้สอดคล้องกับ semantics ใหม่ และลด exposure ของ raw waiting drafts ต่อผู้ใช้ปลายทาง
  - เพิ่ม regression tests ครอบกรณี revive draft, reuse active draft, และกันการ revive ผิด row
  - จัด rollout/rollback แบบปลอดภัยโดยไม่ทำลายข้อมูลเก่า
- Out of Scope:
  - ไม่แยกตารางใหม่เช่น `payment_intents` หรือทำ domain split เต็มรูปแบบในรอบนี้
  - ไม่เปลี่ยน slip verification provider contract หรือ SlipOK integration
  - ไม่แตะ referral, prediction, auth, support webhook, LINE notification contract, หรือ payment success CTA logic เว้นแต่จำเป็นต่อ type/contract compatibility
  - ไม่ทำ destructive cleanup ข้อมูลเก่าแบบลบ/merge row ใน production โดยไม่มี ops sign-off

## Current Ground Truth
- ปัจจุบันเปิด modal แล้วเรียก `POST /api/payment/orders` ซึ่งจะ reuse เฉพาะ active order ที่ยังไม่หมดเวลา มิฉะนั้นจะ create row ใหม่
- `submitSlip` ใช้ order เดิม ไม่ได้ create order ใหม่ตอน confirm; ปัญหา duplicate เกิดจาก creation semantics ก่อนส่งสลิป ไม่ใช่จาก fulfillment path
- Billing API ปัจจุบันซ่อน noise orders เป็นค่าเริ่มต้น แต่ยังมี `showAll` และตัว model ด้านหลังยังถือ draft เป็น order จริง
- Package page เก็บ `ACTIVE_ORDER_KEY` แล้ว restore ด้วย `orderId` เดิมอยู่แล้ว จึงเข้าทางแนว revive row เดิมมากกว่าการเปลี่ยน model ใหม่

## Target Semantics
- "Draft payment order" = row ที่ยังไม่มี slip evidence, ไม่มี credited transaction, และยัง represent purchase journey เดียวที่ user ยังไม่ได้ยืนยันการจ่ายจริง
- User 1 คน + packagePrice 1 ตัว + channel 1 แบบ ควรมี draft row ล่าสุดได้เพียง 1 row ที่ revive ได้
- เมื่อ user กลับมาเริ่มจ่ายใหม่หลัง draft หมดเวลา ระบบต้อง refresh draft เดิมแทนสร้าง row ใหม่
- เมื่อมี slip evidence แล้ว row นั้นจะกลายเป็น verification record และห้ามถูก revive เป็น draft อีก
- Billing surface ผู้ใช้ควรเห็นเฉพาะรายการที่มีความหมายทางธุรกิจจริง เช่น submitted/verified/rejected/credited และไม่ควรถูกบังคับให้ตีความ raw waiting drafts

## Phases

### Phase 1: Lifecycle Contract Hardening ✅ DONE (2026-03-20 09:13)
- Deliverables:
  - สร้าง reusable-draft policy ใน `payment-order-service` ให้รองรับ 2 เส้นทางชัดเจน
  - เส้นทาง A: reuse active draft ที่ยังไม่หมดเวลา
  - เส้นทาง B: revive latest expired/no-slip draft แทนการ create ใหม่
  - เพิ่ม helper ที่ทำให้เงื่อนไข reusable/revivable อ่านตรงกัน เช่น `findReusableDraftOrder()` และ `reviveDraftOrder()`
  - ล็อกเงื่อนไขว่า row ที่เคยมี `slipImageUrl`, verification logs, หรือ credit transaction แล้ว ห้ามเข้าสู่ revive path
  - ตัดสินใจและล็อก policy ของ `referenceCode` ให้ชัดเจน
- Recommended policy:
  - คง `referenceCode` เดิมเมื่อ revive draft เดิม เพื่อ continuity ใน support และลดความสับสนของผู้ใช้
- Exit Criteria:
  - Service layer สามารถแยก active draft, revivable expired draft, และ non-revivable order ได้ deterministic
  - ไม่มี path ที่ revive row ที่มี slip evidence หรือ credited แล้ว
- Critical Test Cases:
  - user/package/channel เดียวกัน + PENDING_PAYMENT ยังไม่หมดเวลา -> reuse row เดิม
  - user/package/channel เดียวกัน + EXPIRED ไม่มี slip/no logs -> revive row เดิม
  - EXPIRED แต่มี `slipImageUrl` หรือ verification logs -> ต้องไม่ revive
  - CREDITED / VERIFYING / SLIP_UPLOADED / VERIFIED -> ต้องไม่ถูก revive เป็น draft

### Phase 2: Create-Order API Integration ✅ DONE (2026-03-20 09:13)
- Deliverables:
  - ปรับ `POST /api/payment/orders` ให้เรียก policy ใหม่จาก service layer ก่อน create row ใหม่
  - ให้ response contract ยัง stable ต่อ frontend เดิม (`order`, `reused`) และเพิ่ม field ใหม่ได้เฉพาะเมื่อ backward-compatible เช่น `reuseMode: 'active' | 'revived' | 'new'`
  - refresh `expiresAt` เมื่อ revive draft และ clear เฉพาะ error fields ที่เป็นของ previous expired draft
  - preserve package/channel validation, promo eligibility gate, และ observability เดิม
  - เพิ่ม event observability ใหม่เช่น `payment.order.revived` ถ้าจำเป็น เพื่อแยก analytics จาก `payment.order.created`
- Exit Criteria:
  - เปิด modal ซ้ำหลัง draft หมดเวลาแล้วไม่สร้าง row ใหม่ หากยังเป็น purchase journey เดิม
  - API contract เก่าไม่แตกสำหรับ `PaymentModal`
- Critical Test Cases:
  - create order ครั้งแรก -> ได้ row ใหม่ `reused=false`
  - เปิด flow ซ้ำขณะ active -> ได้ row เดิม `reused=true`
  - เปิด flow ซ้ำหลัง expired/no-slip -> ได้ row เดิมพร้อม expiry ใหม่
  - promo/new-customer guards ยังทำงานเหมือนเดิม

### Phase 3: Frontend Journey Consistency ✅ DONE (2026-03-20 10:08)
- Deliverables:
  - ทบทวน `PaymentModal` และ `package/page.tsx` ให้เข้ากับ semantics ใหม่โดยไม่เปลี่ยน UX flow หลัก
  - ยืนยันว่า `ACTIVE_ORDER_KEY` ยัง restore journey เดิมได้ถูกต้องแม้ row ถูก revive
  - ปรับ copy ที่ user เห็นให้สื่อว่าระบบกำลัง "กู้คืน/ต่อคำสั่งเดิม" แทนสร้างรายการใหม่ ถ้าจำเป็น
  - พิจารณาปิดหรือซ่อน user-facing `showAll` ใน billing page ถ้ายังขัดกับ product semantics ใหม่
- Exit Criteria:
  - user เปิด modal ใหม่หลัง draft หมดเวลา เห็น QR/flow เดิมต่อเนื่อง ไม่เห็น duplicate order ใหม่ใน practical journey
  - restore จาก local storage ไม่ทำให้เปิด order ผิด row
- Critical Test Cases:
  - browser refresh/reopen modal แล้ว restore order เดิมได้
  - revived draft ถูก poll และ submit slip ได้เหมือน order ใหม่
  - terminal states (`CREDITED`, `REJECTED`, `EXPIRED` with slip evidence) ไม่ถูก restore เป็น active draft ผิด ๆ

### Phase 4: Billing Surface Alignment ✅ DONE (2026-03-20 10:08)
- Deliverables:
  - ยืนยัน default visibility policy ของ `/api/payment/orders/me` ให้สอดคล้องกับ semantics ใหม่
  - ตัดสินใจเรื่อง `showAll`:
    - ตัวเลือกแนะนำ: เอา checkbox ออกจาก user surface หรือจำกัดไว้เฉพาะ internal/debug path
  - ปรับ UI/filter labels ให้สื่อว่า list นี้คือ "รายการชำระเงินจริง/ที่มีความหมายต่อการติดตาม" ไม่ใช่ทุก raw session
  - รักษา support CTA เฉพาะสถานะที่มีบริบทธุรกิจจริง เช่น VERIFYING/REJECTED/EXPIRED-with-slip
- Exit Criteria:
  - billing page ไม่ทำให้ user สับสนว่าเกิดการจ่าย 2 ครั้งจาก draft ที่ยังไม่เคยยืนยันจริง
  - support flow ยังมีข้อมูลอ้างอิงพอสำหรับทีมงาน
- Critical Test Cases:
  - default billing list ไม่โชว์ duplicate waiting drafts
  - explicit filters ยังคืนข้อมูลตรง status ที่ร้องขอ
  - support CTA ไม่หายจากรายการที่ยังต้องมี human follow-up จริง

### Phase 5: Rollout Safety, Legacy Data, and Hard Gate ✅ DONE (2026-03-20 10:08)
- Deliverables:
  - ประเมินข้อมูลเก่าใน production ว่ามี duplicate no-slip drafts จำนวนเท่าไร และกำหนด non-destructive cleanup policy
  - ถ้าจำเป็น ให้ทำ one-time ops note สำหรับ archive/hide legacy drafts โดยไม่แตะ credited/submitted rows
  - hard gate ครบ: build, lint, targeted tests, full tests ตามความเหมาะสม
  - manual smoke checklist สำหรับ package -> QR -> expire -> reopen -> slip submit -> billing history
- Exit Criteria:
  - rollout ใหม่ไม่สร้าง duplicate drafts สำหรับ case ที่เป็น pain point หลัก
  - มี rollback path ชัดเจนโดย revert behavior กลับ active-only reuse policy เดิมได้
- Critical Test Cases:
  - expire draft แล้ว reopen package -> system revive row เดิม
  - credited order เสร็จแล้วซื้อใหม่อีกรอบ -> create row ใหม่อย่างถูกต้อง
  - rejected with slip evidence -> ไม่ถูก revive ทับ; user ต้องเริ่ม journey ใหม่อย่างชัดเจน
  - delayed recheck (`VERIFYING`) ยังคง state machine เดิมและ support CTA ยังใช้ได้

## Risks & Countermeasures
- Risk: revive ผิด row ถ้ามีหลาย package หรือหลาย channel
  - Countermeasure: match ด้วย `userId + packagePriceId + metadata.channel` และจำกัดเป็น latest eligible draft เท่านั้น
- Risk: revive row ที่เคยมี slip evidence ทำให้ audit trail เลอะ
  - Countermeasure: เพิ่ม guard ว่าถ้ามี `slipImageUrl` หรือ verification log แม้แต่ 1 รายการ ห้าม revive
- Risk: `referenceCode` continuity อาจขัดกับ ops expectation ถ้าเคยใช้เป็น per-attempt id
  - Countermeasure: confirm policy ใน code comments/tests และถ้าจำเป็นให้เพิ่ม `metadata.reviveCount` แทนการเปลี่ยน reference
- Risk: legacy duplicates ยังอยู่ในฐานข้อมูล แม้ behavior ใหม่แก้ future flow แล้ว
  - Countermeasure: แยก rollout behavior change ออกจาก cleanup; cleanup ทำแบบ read-audit ก่อนเสมอ
- Risk: billing UI กับ API semantics ไม่ตรงกันหลังแก้ backend
  - Countermeasure: ship Phase 2 + 3 + 4 ใน thread เดียวและล็อก regression tests ตั้งแต่ต้น

## Rollback Strategy
- Rollback Trigger:
  - พบว่า revive policy ดึง order ผิด row, restore flow แตก, หรือ billing/support traceability ลดลง
- Rollback Steps:
  - revert service-layer revive logic ให้กลับไปใช้ active-only reuse policy เดิม
  - คง database rows ที่ถูก revive ไว้ตามจริง ห้ามลบหรือ rewrite ประวัติ
  - ถ้าจำเป็น ปิด `showAll` หรือซ่อน billing drafts ทาง UI ต่อชั่วคราวเพื่อกัน confusion ระหว่าง rollback
- Safe Point:
  - ถ้าแยก commit ตาม phase จะ rollback ได้ที่ service/API phase โดยไม่ต้องย้อน support/payment-aftercare changes รอบก่อน

## Verification Strategy
- Build:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test:
  - targeted:
    - `npm run test -- __tests__/api/payment-orders-route.test.ts`
    - `npm run test -- __tests__/api/payment-orders-me-route.test.ts`
    - `npm run test -- __tests__/services/payment-fulfillment-service.test.ts`
    - `npm run test -- __tests__/api/payment-order-slip-route.test.ts`
  - broader confidence:
    - run project test suite if targeted tests pass cleanly and no unrelated failures block signal
- Manual Smoke:
  - เปิด package page -> เปิด QR -> ปล่อยหมดเวลา -> เปิดซื้อใหม่ -> ต้องได้ order เดิมถูก revive
  - ส่งสลิปบน revived order -> verify/credit ได้ปกติ
  - เข้า billing page -> ไม่เห็น duplicate waiting/paid pairs สำหรับ journey เดียว
  - เคสซื้อใหม่หลังเครดิตเข้าแล้ว -> ต้องได้ order ใหม่จริง

## Implementation Notes
- แนะนำทำเป็น 1 objective, 5 phases, ไม่ต้องแตก sub-plan ถ้ายังไม่ขยายไปถึง domain split
- ถ้าระหว่าง implement พบว่าต้องเปลี่ยน schema เพื่อทำ revive safely ให้หยุดและออกร่าง sub-plan ใหม่แทน ไม่ patch schema แบบฉาบฉวย
- ถ้า production data audit พบ duplicate drafts ปริมาณมาก ควรเพิ่ม ops snapshot แยกอีกไฟล์สำหรับ cleanup policy โดยไม่รวมใน code plan นี้

## Recommended Handoff
- Soldier mode ถัดไปควรเริ่มจาก service-layer tests ก่อน แล้วค่อยแตะ API route
- ห้ามเริ่มจาก billing UI เพราะ pain point นี้เป็น backend lifecycle problem เป็นหลัก ไม่ใช่ presentation-only issue

