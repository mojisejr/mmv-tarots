# Snapshot: แผนการแก้ไขระบบ Onboarding & Referral (ฉบับสมบูรณ์)

**Time**: 2026-01-19 22:05
**Context**: แผนบูรณาการเพื่อแก้ไข Triple Star Glitch และ UI Desync โดยใช้กลยุทธ์ "รวบอำนาจที่ Ritual Gate"

## 🎯 เป้าหมายหลัก
1.  **Stop the Glitch**: ดาวต้องมีค่าเป็น 1 (ปกติ) หรือ 2 (จากเพื่อนแนะนำ) เท่านั้น ห้ามงอกเป็น 3
2.  **Data Integrity**: `referred_by_id` ต้องถูกบันทึกอย่างแม่นยำ และ `ReferralHistory` ต้องซิงค์กับผลรางวัล
3.  **UI Sync**: หน้าจอป้อนคำถามต้องแสดงดาวที่อัปเดตทันทีหลังจากจบ Onboarding Modal

---

## 🏗️ รายละเอียดการแก้ไข (Technical Blueprint)

### 1. [Auth Hook] ลดบทบาทเหลือเพียง "ผู้จดบันทึก" (lib/server/auth.ts)
- **ยกเลิก**: การเรียก `CreditService.grantOnboardingBonus` ในจังหวะ Login
- **ปรับปรุง**: ให้ `referralService.processReferralSignup` ทำหน้าที่เพียงแค่:
    - ผูก `referredById` ลงใน User table
    - บันทึก IP Address
    - สร้าง `ReferralHistory` ในสถานะ `PENDING`
- **เป้าหมาย**: Login ต้องเร็วที่สุด และ "ห้ามแจกดาว" ในขั้นตอนนี้

### 2. [Ritual Gate API] ผู้คุมกฎหนึ่งเดียว (app/api/user/onboarding/route.ts)
- **ปรับปรุง**: ให้เป็นจุดเดียวที่จัดการรางวัลทั้งหมด (Centralized Authority)
    - เช็ค Idempotency: ถ้า `onboardingCompleted` เป็น true แล้ว ให้หยุดการทำงานทันที
    - **Transaction Block**:
        1. บวกดาว Onboarding (+1)
        2. เช็คประวัติ Referral ของตนเอง ถ้ามีคนแนะนำมา (+1) และอัปเดตประวัติเป็น `GRANTED` (สำหรับรางวัลฝั่งคนสมัคร)
        3. อัปเดต `onboardingCompleted: true`
- **เป้าหมาย**: การันตีว่าดาวจะขึ้น 1 หรือ 2 เท่านั้น และบันทึกลง Transaction Log อย่างถูกต้อง

### 3. [Referral Service] ปรับจูนสถานะ (lib/server/services/referral-service.ts)
- **ปรับปรุง**: แยก Logic การ "จดบันทึกตอนสมัคร" ออกจากการ "แจกรางวัล"
- **เป้าหมาย**: ป้องกันความสับสนระหว่างรางวัลของ "คนสมัคร" (ได้ทันทีตอนจบ Ritual) และ "คนแนะนำ" (ได้หลังจากคนสมัครถามคำถามแรก)

### 4. [Service Layer] ระบบตรวจสอบซ้ำ (services/credit-service.ts)
- **ปรับปรุง**: เพิ่มการเช็คภายในฟังก์ชันแจกดาว ว่า User คนนี้เคยได้รับรางวัลประเภทเดียวกันไปหรือยัง (Internal Idempotency)

### 5. [Frontend] การซิงค์หน้าจอ (WelcomeModal.tsx + NavigationProvider)
- **ปรับปรุง**: เมื่อ Ritual Gate ตอบกลับมาว่าสำเร็จ Front-end ต้องสั่ง `refreshBalance()` ทันที เพื่อดึงค่า `stars` ล่าสุดจาก DB เข้ามาใน Client State
- **เป้าหมาย**: แก้ปัญหาดาวไม่ขึ้นที่หน้า Home ทันทีหลังจากผ่าน Onboarding

---

## ✅ Verification Checklist
- [ ] สมัครแบบปกติ -> ผ่าน Ritual -> ดาวต้องเป็น 1 เป๊ะ (ใน Client & DB)
- [ ] สมัครผ่านลิงก์เพื่อน -> ผ่าน Ritual -> ดาวต้องเป็น 2 เป๊ะ (ใน Client & DB)
- [ ] ใน Database ต้องเห็น Transaction LOG: `ONBOARDING` และ `REFERRAL` อย่างละครั้ง
- [ ] ค่า `referred_by_id` ต้องไม่หายไปไหนหลังจากจบ Onboarding

## Tags
`final-plan` `onboarding-fix` `referral-integrity` `mmv-tarots` `oracle-blueprint`
