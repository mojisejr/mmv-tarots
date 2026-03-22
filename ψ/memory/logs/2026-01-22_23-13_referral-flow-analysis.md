# Snapshot: การวิเคราะห์ Referral Flow (Sharing vs Direct)

**Time**: 2026-01-22 23:13 GMT+7
**Context**: วิเคราะห์ความสอดคล้องระหว่างการแชร์ผลทำนายและการส่งลิงก์แนะนำสมาชิกโดยตรงในโปรเจกต์ `mmv-tarots`

## Insight

ผลการวิเคราะห์ยืนยันว่าทั้งสองช่องทาง (Two-Way Entry) นำไปสู่การนับผล Referral ที่สมบูรณ์เหมือนกัน เนื่องจากการออกแบบที่ใช้ **Middleware-First Attribution**:

1.  **Uniform Parameter**: ทั้ง Share URL (`/share/[id]?ref=xxx`) และ Direct URL (`/?ref=xxx`) ใช้ parameter `ref` ในรูปแบบเดียวกัน
2.  **Middleware Capture**: `middleware.ts` ทำหน้าที่เป็น Gatekeeper ดักจับ `ref` จากทุก Request (ยกเว้น API/Static) และทำการฝัง Cookie `mmv_ref` (อายุ 30 วัน) ทันทีที่ "First Touch"
3.  **Auth Integration**: ในขั้นตอนลงทะเบียน (`lib/server/auth.ts`), ระบบจะดึงค่าจาก Cookie `mmv_ref` มาใช้ผูกความสัมพันธ์ผ่าน `referralService.processReferralSignup` ไม่ว่า User จะเข้ามาจากทางหน้าแชร์หรือหน้าหลัก

## Apply When

- ใช้ยืนยันความถูกต้องของระบบ Referral เมื่อมีการแก้ไข Middleware หรือโครงสร้าง URL
- ใช้เป็นตัวอย่างการทำ Marketing Attribution ที่เน้น User Experience (เพื่อนเห็นไพ่ก่อนสมัคร) โดยไม่เสียความสามารถในการแทร็กผล

## Tags

`referral-system` `middleware` `business-logic` `mmv-tarots`
