# Snapshot: Package Design & Cost Analysis (mmv-tarots)
**Date**: 2026-01-05 22:30 GMT+7
**Issue**: #none
**Model**: Gemini 3 Flash (Preview)

## 1. Token Usage Analysis (Per Question)

ระบบ `mmv-tarots` ใช้ Multi-Agent Workflow (3 Agents) ทำให้ 1 คำถามมีการเรียก AI ทั้งหมด 4 ครั้ง (Mystic Agent เรียก 2 ครั้ง: เลือกไพ่ และ ทำนาย)

| Agent | Input Tokens (Est.) | Output Tokens (Est.) | Description |
| :--- | :--- | :--- | :--- |
| **Gatekeeper** | 450 | 50 | ตรวจสอบความเหมาะสมของคำถาม |
| **Analyst** | 550 | 150 | วิเคราะห์ Mood/Topic/Context |
| **Mystic (Selection)** | 1,960 | 50 | เลือกไพ่จาก Database (78 ใบ) |
| **Mystic (Reading)** | 1,500 | 1,000 | ทำนายดวงตามบริบทและไพ่ที่เลือก |
| **Total** | **4,460** | **1,250** | **รวมต่อ 1 คำถาม** |

---

## 2. Cost Calculation (Gemini 2.5 Flash)

อ้างอิงราคาจาก Google AI Studio (Paid Tier) ณ วันที่ 5 มกราคม 2026:
- **Input**: $0.30 / 1M tokens
- **Output**: $2.50 / 1M tokens

### คำนวณเป็น USD:
- Input Cost: (4,460 / 1,000,000) * 0.30 = $0.001338
- Output Cost: (1,250 / 1,000,000) * 2.50 = $0.003125
- **Total Cost per Question**: **$0.004463**

### คำนวณเป็น THB (อัตราแลกเปลี่ยน 35 THB/USD):
- $0.004463 * 35 = **0.1562 THB**
- **สรุปต้นทุน AI กลมๆ**: **0.20 บาท ต่อคำถาม** (เผื่อ Retries และคำถามยาว)

> **Optimization Note**: หากเปลี่ยนไปใช้ **Gemini 2.0 Flash** ต้นทุนจะลดลงเหลือประมาณ **0.033 บาท ต่อคำถาม** (ลดลงเกือบ 5 เท่า)

---

## 3. Package Design Proposal (Know-how Value Strategy)

กลยุทธ์นี้เน้นการให้คุณค่ากับ **"Know-how"** และการออกแบบระบบ Multi-agent โดยตั้งราคาฐาน (Anchor Price) ไว้ที่ **10 บาท/คำถาม** เพื่อสะท้อนคุณภาพและความแม่นยำของคำทำนาย

| Package | Regular Price | **First-time Special** | Credits (Stars) | AI Cost | Net Profit (1st Time) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter** | 99.- | **49.-** | 10 | 2.- | 27.24 |
| **Standard** | 249.- | **129.-** | 30 | 6.- | 84.36 |
| **Premium** | 399.- | **199.-** | 60 | 12.- | 131.84 |

### เหตุผลในการออกแบบ (Value-Based Pricing):
1. **Know-how has Value**: การตั้งราคาฐานที่ 10 บาท/ข้อ ช่วยสร้าง **Perceived Quality** ว่านี่คือคำทำนายระดับพรีเมียมที่มีการวิเคราะห์ลึกซึ้ง ไม่ใช่แค่การสุ่มข้อความทั่วไป
2. **First-time Special (50% Off)**: การลดราคาเหลือประมาณ 5 บาท/ข้อ สำหรับครั้งแรก เป็นจุดที่ดึงดูดใจ (Attractive) แต่ยังคงรักษาภาพลักษณ์ของแบรนด์ไว้ได้ และไม่ขาดทุนตั้งแต่ก้าวแรก
3. **Healthy Margin**: แม้จะลดราคา 50% แต่ด้วยต้นทุน AI ที่ต่ำ ทำให้เรายังมีกำไรสุทธิที่แข็งแกร่ง เพื่อนำไปพัฒนาระบบต่อในระยะยาว
4. **Anchor Psychology**: ราคาปกติ (Regular Price) จะทำหน้าที่เป็นตัวยึดเหนี่ยวให้ผู้ใช้รู้สึกว่าการซื้อครั้งแรกหรือการซื้อ Package ใหญ่มีความคุ้มค่าอย่างมาก

---

## 4. Next Steps
- [x] วิเคราะห์กลยุทธ์ราคา "Know-how Value"
- [x] ออกแบบ Package พร้อมโปรโมชั่นซื้อครั้งแรก (50% Discount)
- [ ] เตรียม UI สำหรับหน้า Package Selection (แสดงราคาปกติ vs ราคาพิเศษ)
- [ ] พัฒนา Logic ตรวจสอบสิทธิ์การซื้อครั้งแรกในระบบ Backend
- [ ] เชื่อมต่อ Stripe Checkout กับ Package ที่ออกแบบไว้
