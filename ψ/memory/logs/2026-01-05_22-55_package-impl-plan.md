# Snapshot: Implementation Plan - Robust Package & Promotion System
**Date**: 2026-01-05 22:55 GMT+7
**Issue**: #none
**Model**: Gemini 3 Flash (Preview)

## 1. Objective
สร้างระบบ Package และ Promotion ที่ยืดหยุ่น (Robust) และจัดการง่าย (Simple) โดยใช้แนวคิด **Product-Price Separation** เพื่อรองรับกลยุทธ์ "First-time Special" และการขยายตัวในอนาคต

---

## 2. Database Schema Refinement (Prisma)

ปรับปรุงโครงสร้างจากเดิมที่ราคาผูกติดกับ Package ให้แยกออกมาเป็น Table `PackagePrice` เพื่อรองรับ 1 Package หลายราคา

```prisma
model StarPackage {
  id          String         @id @default(cuid())
  name        String
  description String?
  stars       Int            // จำนวนดาวที่จะได้รับ
  active      Boolean        @default(true)
  prices      PackagePrice[] // เชื่อมไปยังราคาต่างๆ
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@map("star_packages")
}

model PackagePrice {
  id            String    @id @default(cuid())
  packageId     String
  amount        Float     // ราคา (บาท)
  type          PriceType @default(REGULAR) // REGULAR, FIRST_TIME, PROMO
  stripePriceId String    // ID จาก Stripe Dashboard (price_...)
  isActive      Boolean   @default(true)
  package       StarPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)

  @@map("package_prices")
}

enum PriceType {
  REGULAR
  FIRST_TIME
  SEASONAL
}
```

---

## 3. Implementation Phases

### Phase 1: Stripe Setup (Manual)
- สร้าง **Products** ใน Stripe Dashboard (Starter, Standard, Premium)
- ในแต่ละ Product ให้สร้าง **2 Prices** (Regular Price และ First-time Price)
- คัดลอก `Price ID` มาเตรียมไว้สำหรับ Seed ข้อมูล

### Phase 2: Backend Logic (Eligibility Service)
- สร้าง Service สำหรับตรวจสอบสิทธิ์ของผู้ใช้ (`PromotionService`)
- Logic: ตรวจสอบใน `CreditTransaction` ว่าผู้ใช้เคยมีรายการ `TOPUP` ที่สำเร็จแล้วหรือไม่
- หากยังไม่เคยมี -> แสดงราคา `FIRST_TIME`
- หากเคยมีแล้ว -> แสดงราคา `REGULAR`

### Phase 3: API & Checkout Integration
- ปรับปรุง `/api/checkout/stripe` ให้รับ `priceId` แทนการสร้าง Dynamic Price
- เพิ่มการ Validation ฝั่ง Server เพื่อป้องกันการส่ง `priceId` ของโปรโมชั่นมาโดยที่ไม่มีสิทธิ์

### Phase 4: UI/UX Enhancement
- หน้าเลือก Package: แสดงราคาปกติ (ขีดฆ่า) คู่กับราคาพิเศษสำหรับผู้ที่มีสิทธิ์
- เพิ่ม Badge "First-time Offer" เพื่อกระตุ้นการตัดสินใจ

---

## 4. Cost & Profit Summary (Recap)
- **AI Cost**: ~0.20 THB / Question
- **Stripe Fee**: 3.6% + 10 THB
- **Target Margin**: > 50% แม้จะเป็นราคาโปรโมชั่นครั้งแรก

---

## 5. Next Steps
- [ ] Update `schema.prisma` และรัน Migration
- [ ] Seed ข้อมูล Package และ Price เบื้องต้น
- [ ] พัฒนา `PromotionService` สำหรับเช็คสิทธิ์
- [ ] ปรับปรุง Stripe Checkout Route
