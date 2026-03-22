# Snapshot: Stripe Integration Readiness
**Timestamp**: 2025-12-26 15:30 GMT+7
**Project**: mmv-tarots
**Issue**: #none

## Current State
- **Backup**: ข้อมูลไพ่ 78 ใบถูกสำรองไว้ที่ `projects/mmv-tarots/prisma/cards_backup.json` เรียบร้อยแล้ว
- **Research**: ค้นหาข้อมูล Stripe Node SDK และแนวทางการ Implement ใน Next.js App Router เสร็จสิ้น
- **Decision**: ใช้ Stripe Checkout (Hosted) เพื่อความ Simple และ Robust

## Technical Requirements Captured
- **SDK**: `stripe` Node.js SDK (v17+)
- **API Version**: `2024-12-18.acacia` (หรือล่าสุด)
- **Environment Variables**:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL`
- **Critical Implementation Details**:
  - ต้องใช้ **Raw Body** ใน Webhook handler เพื่อตรวจสอบ Signature
  - ใช้ `stripeSessionId` ใน `CreditTransaction` เพื่อทำ Idempotency (ป้องกันการเติมดาวซ้ำ)
  - ใช้ Stripe CLI (`stripe listen`) สำหรับการทดสอบ Local Webhooks

## Next Steps
- Revise Master Plan เพื่อรวมรายละเอียดทางเทคนิคเหล่านี้
- เริ่ม Phase 1: Schema Update
