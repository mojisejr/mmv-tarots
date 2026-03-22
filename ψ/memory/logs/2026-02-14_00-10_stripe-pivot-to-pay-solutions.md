# 📸 Snapshot: Stripe Suspension & Pivot to Pay Solutions

**Timestamp**: 2026-02-14 00:10 GMT+7
**Project**: `projects/mmv-tarots`
**Issue Reference**: #stripe-suspension

## 🔍 Context & Discovery
1.  **Stripe Status**: บัญชีโดนระงับ "In Review" นานกว่าปกติ เนื่องจากเข้าข่าย "Prohibited Businesses" ในไทย (Psychic services and fortune tellers).
2.  **Market Change**: GB Prime Pay ถูกควบรวมโดย Xendit ทำให้หน้าสมัครสำหรับ "บุคคลธรรมดา" (Individual) หายไปหรือสมัครยากขึ้นมาก.
3.  **Alternative Found**: **Pay Solutions** ยังคงเปิดรับสมัครบุคคลธรรมดา (Individual) และมี API รองรับ PromptPay/Credit Card สำหรับ Merchant ไทย.

## 🎯 Strategic Decisions
- **Pivot Target**: ย้ายจาก Stripe ไปใช้ **Pay Solutions** เป็นหลัก.
- **Framing Strategy**: เปลี่ยนคำอธิบายธุรกิจจาก "ดูดวง/Tarot" เป็น **"Personal Consultation / Life Coaching"** เพื่อลดความเสี่ยงจากการแบน (Risk Mitigation).
- **Payment Method Priority**: เน้น **QR PromptPay** เพื่อลดความเสี่ยง Chargeback และปัญหาจาก Stripe Global Policy.

## 🛠️ Next Technical Steps
- ตรวจสอบ API Documentation ของ Pay Solutions สำหรับ Next.js.
- เตรียมระบบ Re-mapping Checkout API จาก Stripe SDK เป็น Pay Solutions REST API.
- เปลี่ยน Webhook Logic ให้สอดคล้องกับ Payload ของ Pay Solutions.

---
**Status**: Researching Pay Solutions Integration.
**Oracle Note**: "Adaptability is survival. Moving from global scanners to local partners."
