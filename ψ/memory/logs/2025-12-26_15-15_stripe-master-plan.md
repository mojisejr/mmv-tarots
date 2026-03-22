# Master Plan: Stripe Checkout Integration for mmv-tarots (Revised)
**Timestamp**: 2025-12-26 15:32 GMT+7
**Project**: mmv-tarots

## 1. Database Schema Analysis & Updates
ปัจจุบันเรามี `CreditTransaction` และ `User.stars` อยู่แล้ว แต่เพื่อให้รองรับระบบ Package ที่ยืดหยุ่นและ Stripe Webhooks ที่ Robust เราต้องปรับปรุงดังนี้:

### New Model: `StarPackage`
เพื่อรองรับการเพิ่ม/แก้ไข Package ผ่าน Database โดยตรง
```prisma
model StarPackage {
  id          String   @id @default(cuid())
  name        String
  description String?
  stars       Int
  price       Float    // ราคาใน THB
  stripePriceId String? // สำหรับเชื่อมกับ Stripe Product/Price
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("star_packages")
}
```

### Update Model: `CreditTransaction`
เพิ่ม `stripeSessionId` เพื่อป้องกันการประมวลผลซ้ำ (Idempotency)
```prisma
model CreditTransaction {
  // ... existing fields
  stripeSessionId String? @unique // เก็บ ID จาก Stripe เพื่อตรวจสอบ
}
```

---

## 2. Technical Specifications (Stripe)
จากการวิเคราะห์ผ่าน Context7 เราจะใช้มาตรฐานดังนี้:
- **SDK**: `stripe` Node.js SDK (v17+)
- **API Version**: `2024-12-18.acacia`
- **Webhook Handling**: 
  - ต้องใช้ **Raw Body** (`req.text()`) ในการตรวจสอบ Signature
  - ตรวจสอบ `stripeSessionId` ก่อนประมวลผลเพื่อป้องกันการเติมดาวซ้ำ
- **Testing**: ใช้ Stripe CLI สำหรับ Forwarding Webhooks ไปยัง Localhost

---

## 3. User Journey (The Flow)
1. **Discovery**: User เข้าหน้า `/package` เห็นรายการแพ็กเกจที่ดึงมาจาก `StarPackage` table
2. **Selection**: User กดปุ่ม "เติมเงิน" ในแพ็กเกจที่ต้องการ
3. **Initiation**: ระบบเรียก API สร้าง Stripe Checkout Session และ Redirect User ไปหน้า Stripe
4. **Payment**: User เลือกจ่ายผ่าน **บัตร** หรือ **PromptPay** (สแกน QR) บนหน้า Stripe
5. **Confirmation**: เมื่อจ่ายเสร็จ Stripe Redirect User กลับมาหน้า `/profile` พร้อมข้อความ Success
6. **Fulfillment (Background)**: Stripe Webhook ส่งสัญญาณมาที่ Server -> ระบบตรวจสอบ `stripeSessionId` -> เพิ่มดาวให้ User -> อัปเดต Transaction เป็น `SUCCESS`

---

## 4. Implementation Phases

### Phase 1: Foundation & Schema (The Bone)
- [ ] Backup `cards` table (Done: 2025-12-26 15:28)
- [ ] Update `schema.prisma` (เพิ่ม `StarPackage` และ `stripeSessionId`)
- [ ] Run `npx prisma migrate dev`
- [ ] Seed ข้อมูล Package เริ่มต้นเข้า Database

### Phase 2: Stripe Checkout API (The Heart)
- [ ] ติดตั้ง `stripe` library
- [ ] สร้าง `app/api/checkout/stripe/route.ts` (สร้าง Session)
- [ ] อัปเดต `app/package/page.tsx` ให้ดึงข้อมูลจาก DB และเรียก API จริง

### Phase 3: Webhook & Fulfillment (The Soul)
- [ ] สร้าง `app/api/webhooks/stripe/route.ts` (รองรับ Raw Body & Signature Verification)
- [ ] ตรวจสอบ Signature และประมวลผล `checkout.session.completed`
- [ ] เชื่อมต่อกับ `CreditService.addStars` เพื่อเติมดาวจริง

### Phase 4: UI/UX Polish (The Skin)
- [ ] เพิ่มหน้า Success/Cancel state
- [ ] จัดการ Loading state ระหว่าง Redirect

---
**Oracle Note**: แผนนี้ถูกปรับปรุงให้ครอบคลุมรายละเอียดทางเทคนิคของ Stripe เพื่อลดความเสี่ยงในการ Implement ผิดพลาด
