# Snapshot: Manual Payment Strategy (Pivot from PG Rejected)

**Time**: 2026-03-06 22:25 GMT+7
**Context**: `mmv-tarots` / Payment Architecture Pivot.
**Decision ID**: `#MMV-PAYMENT-PIVOT-01`

## Outcome
ตัดสินใจวางแผนปรับกลยุทธ์จาก **Payment Gateway (Omise)** ไปสู่ระบบ **Simple + Robust Manual Payment** หลังจากเผชิญปัญหา Gateway Rejected ซ้ำซาก เพื่อให้สามารถเริ่มรับรายได้ได้ทันทีโดยไม่ต้องรอ External Approval.

## Insight
1. **Gateway Latency**: การพึ่งพา Gateway ในช่วงแรกทำให้ Time-to-Market ช้าลงเนื่องจากกระบวนการ Review ที่คุมไม่ได้
2. **Hybrid Advantage**: การใช้ QR Code + Manual Admin จัดการ Credit ช่วยลดค่าธรรมเนียม (Zero Fee) และเพิ่มความแม่นยำในการรักษาความสัมพันธ์กับลูกค้า (High Touch) ผ่าน Facebook/LINE
3. **LIFF as Container**: การย้ายเข้า LINE LIFF ช่วยลด Friction ในการ Login และเพิ่มประสิทธิภาพในการแจ้งเตือน (Notifications) ผ่าน Messaging API

## Evidence
- **Current Stack**: มีระบบ `Stars` (Credit) ในฐานะข้อมูล และมี API สแตนด์บายที่ [projects/mmv-tarots/app/api/checkout/omise](projects/mmv-tarots/app/api/checkout/omise) ซึ่งสามารถดัดแปลงเป็นโครงสร้าง Admin Update ได้
- **Web Research**: LINE LIFF รองรับการทำ Identity Identity และ Seamless User Experience ภายในแแอป LINE

## Next Actions
- [ ] Draft Schema สำหรับหน้า **Admin Credit Management Dashboard**
- [ ] ออกแบบ UI สำหรับการแสดง **QR Code** ในหน้า Checkout
- [ ] ศึกษาการ Migrate Auth/Landing เข้าสู่ **LINE LIFF** สำหรับ `mmv-tarots`

## Tags
`sss` `mmv-tarots` `payment-pivot` `manual-payment` `line-liff` `admin-dashboard` `decision`
