# Snapshot: Production Readiness Checklist (Stripe Live Mode)
**Date**: 2025-12-26 16:54 GMT+7
**Project**: mmv-tarots
**Status**: Planning for Live Deployment

## 1. Environment Variables (Live Mode)
เมื่อต้องการสลับไปใช้ระบบจ่ายเงินจริง คุณต้องอัปเดตค่าใน `.env` (หรือใน Vercel Dashboard) ดังนี้:

| Variable | Source | Note |
| :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (Live) | ขึ้นต้นด้วย `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard (Live) | ขึ้นต้นด้วย `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks | ได้หลังจากสร้าง Webhook Endpoint |
| `NEXT_PUBLIC_APP_URL` | Production Domain | เช่น `https://mmv-tarots.com` |

## 2. Webhook Configuration (Production)
ในโหมด Production คุณไม่ต้องรัน `stripe listen` แล้ว แต่ต้องตั้งค่าใน Stripe Dashboard:
1. ไปที่ **Developers > Webhooks > Add endpoint**.
2. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`.
3. **Select events**: เลือก `checkout.session.completed`.
4. **HTTPS**: Stripe บังคับว่า URL ต้องเป็น `https://` เท่านั้น.

## 3. Code Adjustments (Minimal)
โค้ดที่เราเขียนไว้รองรับ Production อยู่แล้ว แต่ควรตรวจสอบจุดเหล่านี้:
- **Success/Cancel URLs**: ตรวจสอบว่า `success_url` และ `cancel_url` ใน `app/api/checkout/stripe/route.ts` ใช้ `process.env.NEXT_PUBLIC_APP_URL` อย่างถูกต้อง (เราทำไว้แล้ว).
- **Error Logging**: ใน Production ควรระวังการ `console.log` ข้อมูล Metadata ที่อาจมีข้อมูลส่วนตัวของ User.
- **Database Seeding**: มั่นใจว่าได้รัน Script สำหรับเพิ่ม `StarPackage` ใน Database ของ Production แล้ว.

## 4. Stripe Account Requirements
- **Account Activation**: ต้องกรอกข้อมูลธุรกิจและบัญชีธนาคารใน Stripe ให้ครบเพื่อรับเงินจริง.
- **Payment Methods**: ตรวจสอบใน Dashboard ว่าได้เปิดใช้งาน **PromptPay** และ **Cards** ในโหมด Live แล้ว.

## 5. Security Checklist
- [ ] มั่นใจว่าไม่ได้เผลอ Commit `.env` ที่มี `sk_live_` ลงใน GitHub.
- [ ] ตรวจสอบว่า Webhook Signature Verification ทำงานอยู่ (เราทำไว้แล้วใน `route.ts`).
- [ ] ตรวจสอบ Idempotency (การเช็ค `stripeSessionId`) เพื่อป้องกันการบวกดาวซ้ำ.

**Oracle Note**: การเปลี่ยนจากโลกจำลอง (Test) สู่โลกความจริง (Live) คือก้าวสำคัญ ความผิดพลาดในโลกความจริงมีมูลค่าเป็นตัวเงิน จงตรวจสอบ Webhook Secret ให้แม่นยำที่สุด
