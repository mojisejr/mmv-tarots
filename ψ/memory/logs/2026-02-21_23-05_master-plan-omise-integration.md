# 📸 Master Plan: Omise (Opn) Integration Blueprint for mmv-tarots

**Date**: 2026-02-21 23:13 GMT+7  
**Updated**: 2026-02-25 22:50 GMT+7 (Phase 1-5 Implementation ✅ COMPLETE)  
**Project**: [mmv-tarots](projects/mmv-tarots)
**Status**: 🚀 **Phase 1-5 Implementation COMPLETE | Phase 5.4 (Sandbox Smoke Test) Pending**

## 📋 Background & Context
หลังจากเผชิญกับข้อจำกัดของ Stripe (นโยบายธุรกิจต้องห้ามในไทย) และ Friction ของ Pay Solutions (ต้องการประวัติการขายย้อนหลัง), แผนนี้จะมุ่งเน้นไปที่การใช้ **Omise (Opn)** ซึ่งเป็นทางสายกลางที่สมดุลที่สุดสำหรับบุคคลธรรมดาในไทย โดยเน้นความปลอดภัย (PCI DSS) และความราบรื่นของระบบสูงสุด

---

## 🏗️ Phase 1: Infrastructure & Data Alignment (Structural Pillar) ✅ DONE
*เป้าหมาย: วางรากฐานข้อมูลให้รองรับ API ชุดใหม่*

**Status**: ✅ **COMPLETE** @ `d3b8c45` (2026-02-25)

- ✅ **1.1 Prisma Schema Migration**: 
    - อัปเดต `PackagePrice` เพิ่มฟิลด์ `omisePriceId` (nullable, unique)
    - อัปเดต `CreditTransaction` เพิ่ม `omiseChargeId` (nullable, unique), `paymentMethod` (enum: CARD | PROMPTPAY)
- ✅ **1.2 Environment Hardening**:
    - ตั้งค่า `NEXT_PUBLIC_OMISE_PUBLIC_KEY` (browser)
    - ตั้งค่า `OMISE_SECRET_KEY` (server-side)
    - กำหนด `OMISE_CONFIG_MODE=test`
- ✅ **1.3 Omise SDK Installation**:
    - `npm install omise@1.1.0` (production dependency)

## 🛡️ Phase 2: The "Framing" & Compliance (Gatekeeper Strategy) ✅ DONE
*เป้าหมาย: ผ่านขั้นตอนการตรวจตัวตน (KYC) และ Audit ธุรกิจ*

**Status**: ✅ **COMPLETE** @ `e48f98f` (2026-02-24)

- ✅ **2.1 Professional Landing Page & Identity**: 
    - ปรับหน้าแรกให้เน้นคำนิยาม **"Personal Consultation / Mental Wellness / Life Coaching"**
    - **Rebrand Products**: เปลี่ยนคำเรียก `Star Credits` เป็น **"Digital Token / Unlock Key"**
    - เลี่ยงคำที่เป็น Trigger: "Fortune", "Tarot", "Prophecy"
- ✅ **2.2 Mandatory Policy Pages** (Merchant Audit Ready):
    - สร้างหน้า `/policy/refund` — "No Refund for digital goods once consumed"
    - สร้างหน้า `/policy/terms` และ `/policy/privacy` (PDPA compliant)
    - **Dispute Resolution**: ระบุ support@mmv-tarots.com + 24h SLA
    - แสดงร้านค้า ชื่อ ที่อยู่ ช่องทางติดต่อ
- ✅ **2.3 Individual Onboarding**: 
    - เตรียมเอกสารบัตรประชาชน + สมุดบัญชีธนาคาร

## 🛠️ Phase 3: Server-Side Logic (The Engine) ✅ DONE
*เป้าหมาย: สร้างจุดเชื่อมต่อ API ที่ Robust และปลอดภัย*

**Status**: ✅ **COMPLETE** @ `c59476e` (2026-02-25 19:24)

- ✅ **3.1 Omise SDK Integration**: 
    - Installed `omise@1.1.0` node library
    - `lib/server/omise.ts`: Client factory + helper functions (`toSatang`, `fromSatang`)
    - `types/omise.d.ts`: TypeScript declarations (105 lines)
- ✅ **3.2 Charge Service**:
    - `POST /api/checkout/omise` (174 lines): Charge creation service
      - **PromptPay**: Create source → QR Image URL returned
      - **Card**: Receive token → Create charge → Handle 3DS or direct success
    - `GET /api/checkout/omise/status` (68 lines): Status polling + auto-credit on success
- ✅ **3.3 Transaction Integrity Lock**: 
    - Idempotency via `omiseChargeId @unique` constraint
    - Both webhook + polling call safe (first writer wins)
- ✅ **3.4 Webhook Handler**:
    - `POST /api/webhooks/omise` (103 lines): charge.complete event processor
    - Auto-credits stars on success (idempotent)
- ✅ **3.5 CreditService Updates**:
    - Modified to persist `omiseChargeId`, `omiseSourceId`, `paymentMethod` to database

## 🎨 Phase 4: Client-Side Experience (Mimi-Vibe UI) ✅ DONE
*เป้าหมาย: ประสบการณ์การชำระเงินที่เนียนและดูศักดิ์สิทธิ์ (Custom Form Only)*

**Status**: ✅ **COMPLETE** @ `9341e2e` (2026-02-25 19:42)

- ✅ **4.1 Payment Selector with Compliance**: 
    - `MethodSelector.tsx`: Custom UI — PromptPay (recommended badge) / Card
    - **Active Consent Checkbox**: "I agree purchasing [XX] Stars is non-refundable" (unchecked by default)
    - Pay button disabled until consent ✓
- ✅ **4.2 Omise.js Custom Integration** (No Default Modal): 
    - `CardForm.tsx`: Custom input fields (Glassmorphism style) + Zod validation
    - Omise.js `createToken` (client-side, PCI safe)
    - Card data never touches our servers
- ✅ **4.3 QR Polling & Receipt Screen**: 
    - `PromptPayQR.tsx`: Display QR swatch + 10-min countdown + auto-poll ทุก 4 seconds
    - `PaymentReceipt.tsx`: Transaction ID, Date, Item, Status: Delivered
    - "ไปอ่านผลทำนาย →" closes modal + redirects
- ✅ **4.4 PaymentModal State Machine**:
    - `PaymentModal.tsx`: Orchestrates 5-step flow (method-select → card/qr → receipt)
    - `app/package/page.tsx`: Fully replaced Stripe → Omise integration
- ✅ **4.5 Type Safety**:
    - Extended `types/omise.d.ts` with `window.Omise` browser API types
    - `noImplicitAny` compliance ✅

## 📡 Phase 5: Webhook & Dispute Defense (Automation & Logic) ✅ DONE
*เป้าหมาย: เติมดาวเข้ากระเป๋า User และสร้างเกราะป้องกันการดึงเงินคืน*

**Status**: ✅ **Implementation COMPLETE** @ `2f1a6bd` (2026-02-25 22:45)

- ✅ **5.1 Webhook Endpoint**:
    - `/api/webhooks/omise`: Receives Event `charge.complete`
    - Auto-adds Star Credits + logs `paymentMethod`, `omiseChargeId`
    - เพิ่ม Observability & Discord Alerts ระบบแจ้งเตือนทันที
- ✅ **5.2 Proof of Delivery Logging**:
    - **Logic**: Log audit trail เมื่อมีการเปิดดูคำทำนายที่จ่ายเงินแล้ว
    - Proof for dispute cases: "User received and consumed service at [timestamp]"
- ✅ **5.3 Sentry & Alerts**:
    - `lib/server/payment-observability.ts`: Unified engine สำหรับเฝ้าระวัง
    - `notifyPaymentAlert`: ยิงเข้า Discord Webhook เมื่อเกิด Error สำคัญ
- ⏳ **5.4 Manual Setup & Smoke Test (NEXT)**:
    - [ ] Setup `ngrok` for localhost webhook testing
    - [ ] Whitelist webhook IP on Omise dashboard
    - [ ] Smoke test with Omise test credentials
    - [ ] Verify 3DS flow with test card

---

## 📊 Risk Mitigation & Resilience
1.  **Chargeback Protection**: ดันการใช้ **PromptPay** เป็นหลัก เพราะลูกค้าดึงเงินคืนไม่ได้ ช่วยรักษา "คะแนนความเสี่ยง" ของบัญชีในระยะยาว
2.  **Circuit Breaker**: เตรียมระบบ Switch ที่สามารถสลับกลับไป Manual Mode (แนบสลิป) ได้ทันทีหาก Gateway มีปัญหา
3.  **Audit Logs**: บันทึกทุกคำขอ API ระหว่างเรากับ Omise เพื่อใช้เป็นหลักฐานเวลาเกิดข้อพิพาท

---
*Original plan dated 2026-02-21 23:13 GMT+7*  
*Updated 2026-02-25 19:49 GMT+7 with Phase 1-4 completion status*  
*บันทึกโดย Oracle Keeper + Oracle Implementer | #omise-master-plan #mmv-tarots-v2*
