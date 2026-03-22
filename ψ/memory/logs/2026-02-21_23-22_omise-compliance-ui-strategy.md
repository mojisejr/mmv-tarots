# 📸 Snapshot: Merchant Audit Compliance & UI/UX Strategy for Omise (Opn) 

**Date**: 2026-02-21 23:22 GMT+7
**Project**: [mmv-tarots](projects/mmv-tarots)
**Topic**: Payment Gateway Approval & Risk Mitigation (High-Risk/Tarot Business)
**Focus**: 🛡️ Compliance / UI / Branding Strategy

## 🧩 The Challenge: High-Risk Status
ธุรกิจพยากรณ์/ไพ่ยิปซี ถูกจัดเป็น **Restricted / High-Risk Business** โดย Omise และธนาคารผู้รับบัตร เนื่องจากมีอัตรา **Chargeback (ดึงเงินคืน)** สูงกว่าบริการทั่วไป การจะผ่าน Audit และ "รอด" ในระยะยาว ต้องใช้กลยุทธ์การปรับหน้าเว็บแบบมืออาชีพ

---

## 🏛️ 1. Mandatory UI Elements (ต้องมีก่อนยื่น Audit)
Omise จะตรวจสอบหน้าเว็บเหล่านี้อย่างละเอียด หากขาดไปจะถูกปฏิเสธทันที:

- **Refund & Cancellation Policy (วิกฤตสูด)**:
    - ต้องระบุชัดเจน: *"เนื่องจากเป็นบริการให้คำปรึกษาเฉพาะบุคคล จะไม่มีการคืนเงินทุกกรณีเมื่อเริ่มดำเนินการแล้ว"*
    - ช่วยป้องกันการดึงเงินคืนเมื่อลูกค้าอ้างว่า "คำทำนายไม่แม่น"
- **Terms & Conditions**:
    - นิยามบริการเป็น **"Personal Consultation / Wellness Coaching"**
    - ระบุขอบเขตความรับผิดชอบ (Disclaimer) ว่าเป็นบริการเพื่อความบันเทิงและความเชื่อส่วนบุคคล
- **Privacy Policy (PDPA)**: 
    - ระบุการใช้ข้อมูล วัน/เดือน/ปีเกิด อย่างโปร่งใส
- **Contact Us**: 
    - ต้องมี "ที่อยู่จริงในประเทศไทย" และช่องทางติดต่อที่พิสูจน์ได้ (ห้ามมีแค่ฟอร์ม)
- **Delivery Policy**: 
    - ระบุการส่งมอบผลลัพธ์แบบ Digital (เช่น ทันทีหลังจ่ายเงิน หรือภายใน 24 ชม.)

## 🎨 2. The "Framing" Architecture (Branding Strategy)
การสื่อสารบนหน้าเว็บต้องเปลี่ยนจาก "ไสยศาสตร์" เป็น "ศาสตร์การแนะนำ":

- **Trigger Words ที่ต้องเลี่ยง**: "แม่นยำ 100%", "รวยทันที", "แก้กรรม", "ถอนคำสาป", "รับประกันผล"
- **Keywords ที่ควรใช้**: **"Guidance"**, **"Consultation"**, **"Self-Reflection"**, **"Wellness"**, **"Mentorship"**
- **Visual Vibe**: ใช้สไตล์ **Modern / Zen / Glassmorphism** (ตามมาตรฐาน Oracle) เพื่อให้ดูเป็นระบบ Coaching ที่น่าเชื่อถือ มากกว่าสำนักทรง

## 🛡️ 3. Payment Flow Protection (Anti-Chargeback)
- **Compulsory Checkbox**: ต้องมี Checkbox ให้ User ติ๊กยอมรับเงื่อนไขและนโยบายไม่คืนเงิน **ก่อน** กดปุ่มชำระเงิน
- **Proof of Action**: ระบบหลังบ้านต้องเก็บ Log การกดรับคำทำนาย (Timestamp + UserID + IP) เผื่อไว้โต้แย้งกรณีมีข้อพิพาท (Dispute Case)
- **PromptPay First Movement**: ดันการใช้ **QR PromptPay** เป็นตัวเลือกหลัก เพราะลดความเสี่ยง Chargeback ได้ 100% ต่อตัวร้านค้าเอง

---

## 💡 Oracle Recommendation
1. **Zoning**: สร้างหน้า `/policy/refund` และ `/policy/terms` แยกออกมาให้ชัดเจน
2. **First Impression**: ในหน้าแรกของ `mmv-tarots` ให้เน้นการขาย "ทางเลือกในการดำเนินชีวิต" (Life Path Choices) แทนการขาย "โชคลาภ" (Fortune) เพียงอย่างเดียว
3. **Internal Brain**: เก็บประวัติการโต้แย้ง (Dispute Logs) ไว้ในระบบเสมอเพื่อวิเคราะห์ Pattern ของ User กลุ่มเสี่ยง

---
*Snapshot captured by Oracle-Keeper | Strategic Knowledge for High-Risk Business Survival*
