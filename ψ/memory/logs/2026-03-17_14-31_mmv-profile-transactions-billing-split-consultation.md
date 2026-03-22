---
type: snapshot
project: mmv-tarots
task_id: "#mmv-profile-transactions-billing-split"
status: active
tags: [snapshot, consultation, plan, transactions, billing, slipok]
related_files:
  - /Users/non/dev/opilot/ψ/memory/logs/mmv-tarots/2026-03-16_23-10_mmv-profile-transactions-billing-split-plan.md
  - /Users/non/dev/opilot/projects/mmv-tarots/project_map.md
  - /Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/route.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/slip-verification-service.ts
---

# Snapshot: MMV Transactions/Billing Consultation Summary

**Time**: 2026-03-17 14:31 +0700
**Context**: คุณนนท์สอบถามเพื่อยืนยันทิศทางก่อนเริ่ม implement ว่า plan ล่าสุดเกี่ยวกับ transaction history/billing หรือไม่, payment stack ตอนนี้เป็น SlipOK/PromptPay ใช่ไหม, และขอภาพรวม UI + user journey

## What We Discussed
- ตรวจสอบว่าแผน upgrade/refactor ล่าสุดของ mmv-tarots คืออะไร
- ยืนยันว่าแผนล่าสุดผูกกับงานแยก Profile -> Transactions/Billing surfaces
- ยืนยัน payment stack ปัจจุบันว่าเป็น PromptPay + SlipOK ไม่ใช่ Omise/Stripe ใน flow หลัก
- ขอภาพจำลอง ASCII UI ของ /profile, /transactions, /billing
- ขอ user journey ของส่วนที่จะ implement ต่อ

## What Oracle Answered
- แผนล่าสุดที่พบคือไฟล์ `2026-03-16_23-10_mmv-profile-transactions-billing-split-plan.md`
- โครงแผนเป็น 5 phases:
  - Phase 1: Profile IA Refactor
  - Phase 2: Transactions Surface
  - Phase 3: Billing API Contract (`GET /api/payment/orders/me`)
  - Phase 4: Billing UI Surface
  - Phase 5: Hard Gate + Rollout
- payment stack ปัจจุบันสำหรับเส้นทางใหม่คือ PromptPay + SlipOK
- Omise/Stripe ที่เห็นตอนนี้เป็นหลักฐานใน migration history/legacy cleanup ไม่ใช่ flow ปัจจุบันที่กำลังจะทำ
- จัด mock ASCII UI และ user journey เพื่อใช้เป็น shared mental model ก่อนลงมือ

## Evidence
- Plan source:
  - `/Users/non/dev/opilot/ψ/memory/logs/mmv-tarots/2026-03-16_23-10_mmv-profile-transactions-billing-split-plan.md`
- PromptPay + SlipOK evidence:
  - `/Users/non/dev/opilot/projects/mmv-tarots/app/api/payment/orders/route.ts`
  - `/Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/slip-verification-service.ts`
  - `/Users/non/dev/opilot/projects/mmv-tarots/prisma/schema.prisma` (`PROMPTPAY_QR`)
- Omise/Stripe appears in legacy migration paths:
  - `/Users/non/dev/opilot/projects/mmv-tarots/prisma/migrations/20260311163000_payment_order_phase1/migration.sql`

## Apply When
- ก่อนเริ่ม implement phase ใหม่ของ profile/transactions/billing
- ตอนต้อง align ทีมว่า ledger 2 มุมมองต่างกันอย่างไร:
  - transactions = wallet-centric
  - billing = payment-centric

## Next Actions
- compact/lock plan แล้วเริ่ม implement Phase 1 (Profile IA Refactor)
- commit แบบ phase-scoped และไม่ push จนกว่าจะตรวจ hard gate ผ่าน

## Guardrails
- ห้ามแตะ core credit fulfillment algorithm โดยไม่จำเป็น
- คง MimiVibe visual primitives เดิม
- ต้องผ่าน build/lint/test ก่อนปิดแต่ละช่วงใหญ่

## Tags
`mmv-tarots` `transactions` `billing-history` `profile-refactor` `slipok` `promptpay` `consultation`
