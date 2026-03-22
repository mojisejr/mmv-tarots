---
type: snapshot
project: mmv-tarots
task_id: "#mmv-payment-success-ux-ppp-2026-03"
status: active
tags: [snapshot, implementation, payment, receipt, ux, line-oa, order-reuse]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/payment-order-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/shared/payment-success-presenter.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/line-oa-notification-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentReceipt.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/components/features/payment/PaymentModal.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/route.ts
---

# Snapshot: MMV Payment Success UX — Phases 0, 1, 2 Complete

**Time**: 2026-03-19 23:10 +0700
**Context**: Implemented first 3 phases of payment success UX refactor plan. Commit `38917be` on `staging`.

## Evidence
- **Phase 0 (Active Order Reuse)**: `paymentOrderService.findActiveOrder()` ตรวจหา active order ก่อน create ใหม่ โดย lookup ตาม `userId + packagePriceId + channel + non-terminal status + not expired` → ถ้าเจอ return order เดิมพร้อม `reused: true`
- **Phase 1 (Success Contract)**: สร้าง `PaymentSuccessSummary` type + `buildLineOaMessage()`, `buildToastMessage()`, `buildPrimaryAction()`, `getSecondaryAction()` ใน `lib/shared/payment-success-presenter.ts` เป็น single truth สำหรับ success copy ทุก surface
- **Phase 2 (Receipt UX)**: `PaymentReceipt` รองรับ primary CTA + secondary CTA แล้ว, reference ถูกลดความ prominence, ข้อความเป็นภาษาไทย, secondary CTA ไปหน้า billing

## Key Changes
- LINE OA notification เปลี่ยนจาก `"Payment completed successfully."` เป็น copy ไทย `"✨ เติมดาวสำเร็จ!"` ผ่าน shared presenter
- Slip route ส่ง `packageName` + `amountTHB` เข้า notification service เพิ่มขึ้น
- `PaymentModal.handleCredited` ใช้ `buildToastMessage()` แทน hard-coded string
- Receipt แสดง `+N ดวง` แทน `N Stars`, ช่องทางเป็น `PromptPay QR` แทน `PromptPay QR + SlipOK`

## Hard Gate
- ✅ Build passed
- ✅ Lint passed
- ✅ Tests: 48 files / 248 tests passed (เพิ่มจาก 47/235)

## Next Actions
- Phase 3: Intended Journey / Return-To flow (add `returnTo` context propagation จาก payment entry point)
- Phase 3.5: Billing history visibility filter
- Phase 4: Integration wiring + observability
- Phase 4.5: Billing support ticket to Discord
- Phase 5: Final hard gate + smoke

## Tags
`snapshot` `mmv-tarots` `payment-success` `receipt-ux` `line-oa` `order-reuse` `phases-0-1-2`
