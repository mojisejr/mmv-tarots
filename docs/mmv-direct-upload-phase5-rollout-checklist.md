# MMV Direct Upload Phase 5 Rollout Checklist

## Context
- Plan: #mmv-direct-upload-rounded-price-ppp-2026-03
- Phase: 5 (Verification & Rollout Safety)
- Date: 2026-03-19

## Hard Gate Evidence
- Build: PASS (`npm run build`)
- Lint: PASS (`npm run lint`)
- Test: PASS (`npm run test`)
- Test summary: 47 files passed, 235 tests passed

## Focused Regression Coverage
- `__tests__/api/payment-order-slip-route.test.ts`
- `__tests__/api/payment-order-status-route.test.ts`
- `__tests__/api/payment-orders-me-route.test.ts`
- `__tests__/api/credits-history-route.test.ts`
- `__tests__/services/payment-fulfillment-service.test.ts`
- `__tests__/components/payment/prompt-pay-qr.test.tsx`
- `__tests__/app/billing-page-phase4.test.tsx`
- `__tests__/app/transactions-page-phase2.test.tsx`

## Manual Smoke Checklist

### iPhone (Safari + LINE in-app if available)
- [ ] เปิด flow ซื้อ package แล้วตรวจว่ายอดใน modal/QR เป็น `xx.00` ตรงกับ package price
- [ ] เลือกรูปสลิปจาก Photos ได้โดยไม่ crash modal
- [ ] ส่งสลิปสำเร็จแล้วเห็นสถานะเป็น `VERIFYING` หรือ `CREDITED` ตาม provider response จริง
- [ ] ถ้ารายการเครดิตเข้าแล้ว หน้า `/billing` และ `/transactions` แสดงหลักฐานรายการเดียวกันได้ครบ
- [ ] ถ้าไฟล์ผิดประเภทหรือใหญ่เกิน limit ระบบขึ้น error ภาษาไทยแบบ actionable และยังเลือกไฟล์ใหม่ได้

### Android (Chrome)
- [ ] เปิดกล้องหรือ gallery เพื่อเลือกสลิปได้
- [ ] submit multipart ได้ต่อเนื่องโดยไม่หลุด session
- [ ] delayed verify (`1010`) ยังแสดง guidance ให้รอและตรวจสอบอีกครั้งได้
- [ ] rejected path (`1012`, `1014`, amount mismatch) ไม่ทำให้ modal หรือหน้า billing ค้าง

### Desktop (Chrome/Safari)
- [ ] drag/select file ผ่าน file picker ได้
- [ ] expired order ถูก block หรือ reject แบบ deterministic หลัง QR timeout
- [ ] credited path แสดง payment reference, rounded THB amount, และ channel สอดคล้องกันระหว่าง modal, billing, transactions

## Go/No-Go Record
- Release candidate commit: `TBD`
- Decision: `GO` / `NO-GO`
- Decision owner: `TBD`
- Timestamp: `TBD`
- Notes: `TBD`

## Rollback Note
- Trigger:
  - real-device upload fail ต่อเนื่องบน iPhone/Android
  - provider ปฏิเสธ multipart format ใน usage จริง
  - billing/transactions แสดง drift จาก credited payment evidence

### Rollback Scope
- Revert as one scoped change set:
  - `8fb63c7` Phase 1 API contract reframe
  - `ff37bf7` Phase 2 SlipOK multipart adapter
  - `3fa7ad1` Phase 3 direct upload payment UX
  - `25df618` Phase 4 billing/transactions consistency hardening

### Rollback Steps
1. Freeze rollout and stop further manual verification on the failing surface.
2. Revert the direct-upload commit set in project scope only.
3. Re-run `npm run build`, `npm run lint`, and `npm run test` before any redeploy.
4. Confirm URL-based fallback path is the only active submission path before reopening payment flow.
5. Capture MIME, filename extension, device, and provider response evidence before replanning.

## Rollout Note
- This checklist closes the development-side gate for direct upload rollout safety.
- Production release should only proceed after at least one live-device pass on iPhone, Android, and desktop is recorded with a GO decision.