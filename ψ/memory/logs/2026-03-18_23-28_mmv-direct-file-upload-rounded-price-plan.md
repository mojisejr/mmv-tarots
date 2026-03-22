# Snapshot: MMV Direct File Upload with Rounded Price

**Time**: 2026-03-18 23:28 +0700
**Context**: Blueprint for replacing URL-only slip submission with direct file upload while keeping rounded package prices

---
type: plan
project: mmv-tarots
task_id: "#mmv-direct-upload-rounded-price-ppp-2026-03"
status: active
tags: [plan, blueprint, mmv-tarots, payment, slipok, direct-upload, rounded-price]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PromptPayQR.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/[id]/slip/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/slip-verification-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-fulfillment-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/api/payment-order-slip-route.test.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/.tmp/mmv/slip-ok-api-guide.md
---

## Objective
- เปลี่ยน MMV payment UX จากการกรอก `slipImageUrl` เป็น direct file upload ไปยัง backend แล้ว forward เข้า SlipOK แบบ `files` โดยคงราคาแบบกลมตาม package price เดิม และไม่เพิ่ม satang strategy ในรอบนี้

## Scope
- In Scope:
  - เปลี่ยน client UI จาก URL input เป็น file picker/mobile-friendly upload flow
  - เปลี่ยน slip submit API ให้รองรับ multipart/form-data และ validate file type/size
  - เปลี่ยน SlipOK client จาก `url` payload ไปเป็น `files` payload โดยยังคง `log` และ `amount`
  - คง fulfillment semantics, billing semantics, และ rounded price policy เดิม
  - เพิ่ม test matrix ครอบคลุม direct upload happy/error paths
- Out of Scope:
  - เพิ่ม unique satang / amount strategy
  - ทำ slip image storage หรือ CDN URL flow
  - เปลี่ยน package price schema หรือ billing math หลัก
  - ทำ OCR pipeline, gallery/history ของรูปสลิป, หรือ background upload queue

## Grounded Findings
- ตอนนี้ UI ใช้ URL-only input ใน `PromptPayQR.tsx` และ route รับแค่ `slipImageUrl`
- SlipOK guide รองรับ `files`, `data`, และ `url`; direct upload จึงทำได้โดยไม่ต้องมี storage กลาง
- payment order creation ใช้ rounded amount จาก `packagePrice.amount` อยู่แล้ว; satang strategy ยังไม่ถูก implement และไม่จำเป็นต่อ direct upload flow
- ไม่มี prior search insight สำหรับหัวข้อนี้ จึงอิง evidence จาก map + code + provider guide เป็นหลัก

## Phases
### Phase 1: API Contract Reframe ✅ DONE (commit `8fb63c7`, 2026-03-18)
- Deliverables:
  - เปลี่ยน `/api/payment/orders/[id]/slip` ให้รับ `multipart/form-data`
  - validate ไฟล์ตามนามสกุล/ MIME ที่ SlipOK รองรับ (JPG/JPEG/PNG/JFIF/WEBP)
  - กำหนด max file size ที่ pragmatic สำหรับ mobile upload พร้อม error response ที่ UI ใช้งานได้
- Exit Criteria:
  - Route รับไฟล์จริงได้แบบ owner-scoped และ reject request ที่ไม่ตรง contract อย่าง deterministic
- Critical Test Cases:
  - valid image upload -> route parse สำเร็จและส่งต่อ service
  - unsupported mime/extension -> 400/422 พร้อม message ชัดเจน
  - unauthenticated / wrong order -> guard เดิมยังทำงาน

### Phase 2: SlipOK Direct Upload Adapter
- Deliverables:
  - ขยาย `slipVerificationService` ให้ส่ง `files` ไป SlipOK แทน `url`
  - รักษา `amount` และ `log` behavior เดิม
  - ออกแบบ abstraction ของ slip payload ให้ route/service ไม่ต้องพึ่ง storage URL อีกต่อไป
- Exit Criteria:
  - Provider call ใช้ multipart/form-data ได้จริงและยัง normalize response/error taxonomy เหมือนเดิม
- Critical Test Cases:
  - file upload payload -> headers/body ตรงตาม guide
  - `1010/1012/1014` mapping ยังไม่ regress เมื่อเปลี่ยน payload mode
  - missing SlipOK config -> deterministic error เดิมยังอยู่

### Phase 3: UX/UI Direct File Upload
- Deliverables:
  - เปลี่ยน `PromptPayQR` จาก URL input เป็นปุ่มเลือกไฟล์ + preview/basic metadata
  - ปรับ CTA, loading, retry, และ mobile UX ให้ชัดว่า upload รูปสลิปได้ทันที
  - คง rounded price display (`99.00`, `199.00`) และเพิ่ม copy ยืนยันว่าให้โอนตามยอดที่แสดง
- Exit Criteria:
  - ผู้ใช้สามารถเลือกไฟล์จากมือถือ/เดสก์ท็อปและส่งสลิปได้โดยไม่ต้องหา URL เอง
- Critical Test Cases:
  - selecting file enables submit button and posts multipart body
  - rejected upload shows actionable Thai error
  - delayed verify path (`1010`) ยังแสดง VERIFYING guidance ได้หลัง direct upload

### Phase 4: Integration Hardening
- Deliverables:
  - ร้อย route -> verification service -> fulfillment -> billing surface ให้ไม่ regress
  - ensure no satang mutation in order creation; package price remains rounded source of truth
  - update tests around payment status / billing if response copy or flow timing เปลี่ยน
- Exit Criteria:
  - direct upload flow เครดิตเข้าได้, delayed/rejected branches ยัง map semantics เดิม, rounded price policy ชัดเจนทั้ง QR และ billing
- Critical Test Cases:
  - happy path: create order -> upload slip file -> credited -> billing row complete
  - expired order after QR timeout -> submit blocked/rejected as expected
  - transactions/billing consistency after credited path

### Phase 5: Verification & Rollout Safety
- Deliverables:
  - focused suites + full hard gate (`npm run build`, `npm run lint`, `npm run test`)
  - manual smoke checklist สำหรับ iPhone/Android/desktop browser
  - rollback note: revert route/service/UI upload contract as one scoped change set if upload fails in real usage
- Exit Criteria:
  - hard gate ผ่านทั้งหมด และ smoke checklist ไม่มี blocker เรื่อง mobile file picker / file size / status transitions
- Critical Test Cases:
  - iPhone photo upload from Photos app works end-to-end
  - Android gallery/camera upload works end-to-end
  - malformed/oversized file yields deterministic UI error without crashing modal

## Risks & Countermeasures
- Risk: multipart parsing + file forwarding ทำให้ route/body handling ซับซ้อนขึ้น
  - Countermeasure: isolate parsing in route helper and keep verification service interface typed
- Risk: mobile browser ส่ง MIME/type ไม่สม่ำเสมอ
  - Countermeasure: validate both MIME and filename extension with tolerant normalization
- Risk: large image causes timeout or memory pressure
  - Countermeasure: define max upload size, compress client-side later if needed, and fail fast with UX copy
- Risk: direct upload without storage ทำให้ debug ยากขึ้นเมื่อ provider reject file
  - Countermeasure: log provider status/error metadata only, not raw image, and expose clear retry/support guidance

## Rollback Strategy
- Trigger:
  - direct upload path fails on real devices, hard gate regressions, หรือ provider rejects multipart format unexpectedly
- Steps:
  - revert direct-upload route/service/UI commit set as one unit
  - temporarily restore URL-based fallback only if there is an operational need
  - keep rounded-price order flow and existing billing semantics unchanged during rollback

## Verification Strategy
- Build: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test: `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Focused suites (minimum):
  - `__tests__/api/payment-order-slip-route.test.ts`
  - new service tests for multipart SlipOK adapter
  - component test for `PromptPayQR` direct upload flow
  - regression check for `__tests__/api/payment-orders-me-route.test.ts`
  - regression check for `__tests__/api/credits-history-route.test.ts`

## Decision Record
- Rounded price remains the UX default and source of truth for this project phase
- Satang strategy is intentionally deferred to avoid user confusion and pricing/billing complexity
- Direct file upload is chosen over storage-backed URL flow to minimize user friction and remove storage dependency from the initial rollout

## Tags
`plan` `ppp` `mmv-tarots` `payment` `slipok` `direct-upload` `rounded-price`

## Update 2026-03-19 00:02 +0700
- Phase 2: **SlipOK Direct Upload Adapter** ✅ DONE
- Commit: `ff37bf7` (`#mmv-direct-upload-rounded-price-ppp-2026-03 phase2 slipok multipart adapter`)
- Outcome:
  - `slipVerificationService` ส่ง `slipFile` ไป SlipOK แบบ `multipart/form-data` ผ่าน field `files`
  - คง `x-authorization`, branch-scoped endpoint, `log`, และ `amount` behavior เดิม
  - เก็บ JSON `url` fallback ไว้เฉพาะกรณี caller ยังส่ง `slipImageUrl`
  - เพิ่ม test ยืนยัน multipart request contract และ error taxonomy เดิมไม่ regress
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `npm run test` ✅
- Next Recommended Phase:
  - Phase 3: UX/UI Direct File Upload

### Phase 2 Exit Criteria Evidence
- Provider call ใช้ multipart body ได้จริงเมื่อมี `slipFile`
- Response normalization (`data.success`, `data.amount`, `data.transRef`) ยังทำงานเหมือนเดิม
- Error mapping `1010`, `1012`, `1013`, `1014` ยังผ่าน test หลังเปลี่ยน payload mode

### Phase 2 Critical Test Coverage
- multipart `files` payload -> headers/body ตรง guide ✅
- missing SlipOK config -> deterministic error เดิม ✅
- `1010/1012/1013/1014` mapping -> ไม่ regress ✅

## Update 2026-03-19 06:24 +0700
- Phase 3: **UX/UI Direct File Upload** ✅ DONE
- Commit: `3fa7ad1` (`#mmv-direct-upload-rounded-price-ppp-2026-03 phase3 direct upload payment ux`)
- Outcome:
  - `PromptPayQR` เปลี่ยนจาก URL input เป็น file picker/mobile-friendly upload flow พร้อม preview และ metadata ของไฟล์
  - submit path เปลี่ยนเป็น `multipart/form-data` พร้อมแนบ `slipFile` ตรงตาม contract ของ route/provider
  - เพิ่ม client-side validation สำหรับ file size/type และปรับ error extraction ให้รองรับ nested API error message ภาษาไทย
  - ปรับ payment modal title/copy ให้แสดงยอดแบบ `xx.00` เพื่อย้ำ rounded price policy ตลอด flow
  - เพิ่ม component tests ครอบ multipart submit, VERIFYING guidance, และ rejected Thai error path
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `npm run test` ✅ (`47 files`, `235 tests`)
- Next Recommended Phase:
  - Phase 4: Integration Hardening

### Phase 3 Exit Criteria Evidence
- ผู้ใช้เลือกไฟล์จากอุปกรณ์ได้และส่งสลิปโดยไม่ต้องใช้ URL ✅
- UI แสดง preview/basic metadata ของสลิปก่อน submit ✅
- delayed verify guidance (`1010`) ถูกดึงกลับมาแสดงใน flow หลัง direct upload ✅

### Phase 3 Critical Test Coverage
- selecting file enables submit button and posts multipart body ✅
- rejected upload shows actionable Thai error ✅
- VERIFYING guidance path remains visible after submit + status poll ✅

## Update 2026-03-19 12:18 +0700
- Phase 4: **Integration Hardening** ✅ DONE
- Commit: `25df618` (`#mmv-direct-upload-rounded-price-ppp-2026-03 phase4 harden billing-transactions consistency`)
- Outcome:
  - เพิ่ม payment evidence ใน `TransactionHistoryList` สำหรับ credited top-up ให้แสดง payment reference, rounded THB amount, และ payment channel จาก ledger data
  - คง `Billing` surface เดิมไว้ แต่ทำให้ `Transactions` อ่านสอดคล้องกับ billing มากขึ้นเมื่อดูรายการเติมเครดิตหลัง direct upload
  - เพิ่ม UI test coverage ยืนยัน credited top-up path แสดง `MMV-PAY-*`, `xx.00 THB`, และ `PromptPay QR` ได้จริง
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `npm run test` ✅ (`47 files`, `235 tests`)
- Next Recommended Phase:
  - Phase 5: Verification & Rollout Safety

### Phase 4 Exit Criteria Evidence
- credited path แสดงผลสอดคล้องกันมากขึ้นระหว่าง `Billing` และ `Transactions` ✅
- rounded price policy ยังเป็น source of truth บน payment flow และ transaction detail (`xx.00 THB`) ✅
- focused suites ของ payment fulfillment, billing, transactions, และ order surfaces ยังผ่านหลัง hardening ✅

### Phase 4 Critical Test Coverage
- happy path evidence บน `Transactions` แสดง payment reference + rounded THB amount + channel ✅
- delayed/rejected semantics บน `Billing` และ `/api/payment/orders/me` ไม่ regress ✅
- full hard gate ของโปรเจกต์ผ่านครบหลัง integration hardening ✅

## Update 2026-03-19 12:26 +0700
- Phase 5: **Verification & Rollout Safety** ✅ DONE
- Commit: `d0aac53` (`#mmv-direct-upload-rounded-price-ppp-2026-03 phase5 rollout checklist and rollback note`)
- Outcome:
  - เพิ่มเอกสาร `docs/mmv-direct-upload-phase5-rollout-checklist.md` สำหรับ direct upload rollout โดยมี hard-gate evidence, focused regression set, manual smoke checklist แยก iPhone/Android/desktop, และ rollback note ที่อิง commit set จริง
  - ยืนยัน focused regression suites ของ payment/order/billing/transactions ผ่านก่อน rerun hard gate เต็ม
  - เก็บ rollback scope เป็น change set เดียวของ Phase 1-4 เพื่อให้ revert ได้แบบไม่แยกชิ้นระหว่าง route/service/UI/read surfaces
- Hard Gate:
  - focused suites ✅ (`8 files`, `28 tests`)
  - `npm run build` ✅
  - `npm run lint` ✅
  - `npm run test` ✅ (`47 files`, `235 tests`)
- Next Recommended Action:
  - Live-device GO/NO-GO pass on iPhone, Android, and desktop using the new checklist before production release

### Phase 5 Exit Criteria Evidence
- hard gate ผ่านครบอีกครั้งบน release candidate ของ Phase 5 ✅
- manual smoke checklist พร้อมใช้และไม่มี blocker เชิงเอกสาร/flow gap สำหรับ iPhone, Android, desktop ✅
- rollback note ระบุ trigger, scope, และขั้นตอน revert แบบ project-scoped ชัดเจน ✅

### Phase 5 Critical Test Coverage
- focused payment/order/billing/transactions regression set ผ่านครบก่อน rollout checklist closeout ✅
- full test suite ของโปรเจกต์ยังเขียวหลังเพิ่ม rollout artifact ✅
- build/lint ยังไม่ regress จาก release-safety documentation update ✅

