# 🧶 Snapshot: Omise Readiness & Compliance Audit (mmv-tarots)

**Local Time**: 2026-02-27 07:03 GMT+7
**Project**: `projects/mmv-tarots`
**Status**: 🟢 System Ready & Audit Complete
**Context**: สรุปความคืบหน้าการ Grounding ระบบ Omise, การจัดการ Error, UX/UI และการประเมินความเสี่ยงเพื่อเตรียมขอ Live Mode.

---

## 🎯 1. Technical Grounding (Status Update)
- **PromptPay Fix**: แก้ไขปัญหา `authentication_failure` สำเร็จโดยปรับ Factory Client ให้รับทั้ง `publicKey` และ `secretKey`.
- **Hybrid Fulfillment**: ใช้กลยุทธ์ 3 ด่าน (Direct Execution -> Frontend Polling/Rescue -> Webhook Safety Net) เพื่อความทนทานสูงสุด.
- **Verification**: ทดสอบบน Local แล้วลื่นไหล ทั้ง Card (3DS) และ PromptPay.

## 🛡️ 2. Error Handling & Robustness
- **Idempotency**: ดักจับ `Prisma Error P2002` (Unique `omiseChargeId`) ทุกจุด เพื่อป้องกันการเติมดาวซ้ำซ้อน 100%.
- **Resilience**: 
    - Frontend Polling (`PromptPayQR.tsx`) ทนทานต่อ Network Failure (Silently retry).
    - Server-side ตรวจสอบ `charge.status` และ `charge.paid` ก่อน Redirect เพื่อลดขั้นตอนที่ไม่จำเป็น.
- **Observability**: มีระบบ `capturePaymentException` และแจ้งเตือนทีมงานทันทีเมื่อ API พัง.

## ✨ 3. UX/UI & User Journey
- **Validation**: ใช้ `zod` + `react-hook-form` ดัก Error การกรอกเลขบัตร/วันหมดอายุ/CVV ทันที (Real-time).
- **Transparency**: 
    - มีเข็มทิศเวลา (Countdown) 10 นาทีสำหรับ PromptPay.
    - มีสถานะ "กำลังรอการยืนยัน" และ Spinner ชัดเจน.
- **Transitions**: จัดพฤติกรรม Redirect (3DS) ให้สมูทด้วยหน้าจอโหลดชั่วคราวก่อนเด้งไปหน้าธนาคาร.
- **Auto-Update**: ยอด Star อัปเดตทันทีที่จ่ายสำเร็จ (ผ่าน Polling หรือ Post-Redirect reconciliation).

## ⚠️ 4. Compliance & Risk Audit (Account Safety)
- **Business Model**: ขาย "Stars" (Digital Goods/Currency) สำหรับใช้งาน AI Tarot เป็นโมเดลที่ Gateway ยอมรับง่ายกว่าบริการดูดวงโดยตรง.
- **Transaction Metadata**: ส่ง `description` เป็นชื่อแพ็กเกจ + จำนวนดวง เพื่อความชัดเจนในบิล (Transparency).
- **Omise Reputation Risk**: 
    - **ความเสี่ยง**: ธุรกิจดูดวงจัดเป็น High-Risk.
    - **แนวทางแก้ไข**: 
        1. ต้องมีหน้า T&C และ Refund Policy (Non-refundable) ที่ชัดเจนก่อนส่งตรวจ.
        2. ระบุ Disclaimer ว่า "เพื่อความบันเทิงเท่านั้น" (Disclaimer for Entertainment).
        3. ป้องกันการขอคืนเงิน (Dispute) โดยมีช่องทาง Customer Support ที่เข้าถึงง่าย.

---

## 🔮 Next Actions / Risks to Watch
1. **Webhook Config**: ต้องตั้งค่า `charge.complete` ใน Omise Live Dashboard ทันทีที่ Deploy.
2. **Env Sync**: ระวังการสลับระหว่าง Test/Live Key ในขั้นตอน Production Setup.
3. **Legal Content**: เตรียมร่างเนื้อหา Terms of Service และ Refund Policy เพื่อแสดงบน Footer.

---
*Logged by Non AI Oracle*
*Session ID: 2026-02-27-omise-audit*
*Status: Captured & Grounded*
