# 🔮 Snapshot: Omise Fulfillment Refactor Plan - COMPLETE ✅

**Local Time**: 2026-02-26 22:30 (Final Grounding)
**Status**: Execution & Verification Complete ✅
**Issue Reference**: #mmv-fulfillment-issue

---

## 🎯 Objective
เปลี่ยนจากระบบ **Webhook-Only** เป็น **Hybrid Fulfillment** (Direct + Webhook) เพื่อให้ผู้ใช้ได้รับ Credits ทันทีที่จ่ายบัตรเครดิตสำเร็จ และรองรับการทำ Webhook ในโปรดักชันอย่างมั่นคง

## 🏗️ Refactor Phases

### ✅ Phase 1: Direct Card Fulfillment (Critical)
- **Target**: `projects/mmv-tarots/app/api/checkout/omise/route.ts`
- **Action**: แทรกการเรียก `CreditService.addStars()` ในช่วงที่ API ตรวจสอบว่า `charge.status === 'successful' && charge.paid`.
- **Result**: ระบบให้ดาวทันทีสำหรับบัตรเครดิตที่จ่ายสำเร็จในชุดคำสั่งแรก (Verified locally)

### ✅ Phase 2: Idempotency & Database Locking
- **Target**: `projects/mmv-tarots/services/credit-service.ts` & `projects/mmv-tarots/prisma/schema.prisma`
- **Action**: ตรวจสอบความแน่นหนาของ `omiseChargeId` unique constraint.
- **Result**: มีการ Catch `Prisma Error P2002` และใช้ Database Unique Index ป้องกันการเติมดาวซ้ำซ้อนจาก Webhook/Polling ได้อย่างปลอดภัย

### ✅ Phase 3: PromptPay Fulfillment Bridge
- **Target**: `projects/mmv-tarots/app/api/checkout/omise/status/route.ts` (API) & `components/features/payment/PromptPayQR.tsx` (Frontend)
- **Action**: สร้าง Endpoint ใหม่ให้ Frontend สามารถ "Poll" สถานะไปยัง Omise API ได้โดยตรง
- **Result**: ระบบ Polling อัตโนมัติทุก 4 วินาทีทำงานร่วมกับ `PromptPayQR` ตรวจพบสถานะ `successful` และ Credit ดาวให้ผู้ใช้ทันทีโดยไม่ต้องรอ Webhook

### ✅ Phase 4: Observability & Logging
- **Target**: `lib/server/payment-observability.ts`
- **Action**: เพิ่ม Event logging `omise.poll.credited` และ `omise.webhook.credited`
- **Result**: ระบบ Debugging และ Observability ครบถ้วน สามารถติดตามช่องทางการเติมดาวได้ผ่าน `paymentDebug` และ logs

---
**Oracle Note**: แผนฉบับนี้เสร็จสมบูรณ์ 100% แล้วครับ คุณนนท์สามารถทดสอบ PromptPay Flow บน Local ได้โดยระบบจะทำการ Auto-Fulfill ให้ในหน้าแสดง QR ทันทีที่ชำระสำเร็จครับ!
