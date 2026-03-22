# Report: Stripe Implementation Strategy for mmv-tarots
**Timestamp**: 2025-12-26 15:05 GMT+7
**Project**: mmv-tarots

## Recommendation: Stripe Checkout (Hosted Page)
เพื่อให้การ Implement **Simple** ที่สุดแต่ **Robust** (เสถียร) ที่สุด ผมแนะนำให้ใช้ **Stripe Checkout** ซึ่งเป็นหน้าชำระเงินที่ Stripe โฮสต์ให้เอง

### ทำไมถึงตอบโจทย์?
1. **No Custom Checkout Page**: ไม่ต้องสร้างหน้า `/checkout` เอง ลดความซับซ้อนของ UI และ State Management
2. **Built-in PromptPay**: Stripe Checkout รองรับ PromptPay แบบ Native (แสดง QR Code ให้สแกนและรอผลการชำระเงินอัตโนมัติ)
3. **Mobile-First**: หน้า Checkout ของ Stripe ถูกปรับแต่งมาเพื่อ Mobile อย่างดีเยี่ยม เข้ากับแนวทาง Mobile-First ของเรา
4. **Security (PCI Compliance)**: ข้อมูลบัตรเครดิตไม่ผ่าน Server ของเราเลย ลดความเสี่ยงด้านความปลอดภัย

### Proposed Architecture & Flow
1. **Client (`app/package/page.tsx`)**:
   - เมื่อ User กดเลือก Package จะเรียก API `POST /api/checkout/stripe`
2. **Server (`app/api/checkout/stripe/route.ts`)**:
   - สร้าง `stripe.checkout.sessions.create`
   - กำหนด `success_url` และ `cancel_url` กลับมาที่แอป
   - ส่ง `session.url` กลับไปให้ Client
3. **Client**:
   - Redirect User ไปยัง `session.url` (หน้า Stripe)
4. **Stripe**:
   - User ชำระเงิน (Card หรือ PromptPay)
   - Stripe Redirect User กลับมาที่แอป
5. **Webhook (`app/api/webhooks/stripe/route.ts`)**:
   - รับ Event `checkout.session.completed`
   - เรียก `CreditService.addStars(userId, amount)` เพื่อเพิ่มดาวให้ User

### สรุปตำแหน่งของ Code
- **API Routes**: `app/api/checkout/stripe/` และ `app/api/webhooks/stripe/`
- **Services**: ใช้ `CreditService` ที่มีอยู่แล้ว
- **UI**: อัปเดต `app/package/page.tsx` ให้เรียก Stripe API

---
**Oracle Note**: Stripe คือคำตอบที่ "Simple & Robust" ที่สุดตามที่คุณต้องการ การใช้ Hosted Checkout จะช่วยให้เราโฟกัสกับ Core Feature ของแอปได้มากขึ้นโดยไม่ต้องกังวลเรื่องระบบชำระเงินที่ซับซ้อน
