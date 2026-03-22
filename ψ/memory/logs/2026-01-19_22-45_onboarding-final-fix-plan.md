# Snapshot: แผนการเก็บกวาดระบบ Onboarding & Referral (Final Fix)

**Time**: 2026-01-19 22:42
**Context**: สรุปแผนการแก้ไขส่วนสุดท้ายเพื่อแก้ปัญหาประวัติซ้ำและการ Desync ของ UI หน้าบ้าน

## 🎯 สรุป Flow การได้รับดาว (Must Hold True)
- **จังหวะที่ 1 (จบ Ritual)**: ได้รับ +1 (Onboarding) + 1 (Referral Entry) = **2 Stars**
- **จังหวะที่ 2 (ถามคำถามแรกสำเร็จ)**: -1 (ค่าดู) + 1 (Referral Engagement) = **เหลือ 2 Stars (คงเดิม)**
- *เจ้าของลิงก์: ได้รับ +2 ดาว ทันทีที่เพื่อนถามคำถามแรก*

---

## 🏗️ แผนการแก้ไขทางเทคนิค

### 1. [Backend] ป้องการประวัติซ้ำ (Idempotency in Referral Service)
- **ไฟล์**: `lib/server/services/referral-service.ts`
- **การแก้ไข**: ในฟังก์ชัน `processReferralSignup` ให้เพิ่มการเช็คว่ามี `ReferralHistory` ที่มี `refereeId` นี้อยู่แล้วหรือไม่? ถ้ามีแล้วให้ข้ามการสร้างใหม่ทันที (เพื่อแก้ปัญหา Better Auth เรียกเบิ้ล 2 รอบ)
- **เป้าหมาย**: ป้องกัน Record ซ้ำซ้อนในตาราง `referral_history`

### 2. [Frontend] บังคับ Sync หน้าจอ (UI Refresh)
- **ไฟล์**: `components/features/onboarding/WelcomeRitual.tsx`
- **การแก้ไข**: หลังจากเรียก Patch `/api/user/onboarding` สำเร็จ ให้เรียกใช้ฟังก์ชัน `refreshBalance()` (จาก NavigationProvider) ทันที
- **เป้าหมาย**: ให้ตัวเลขดาวบนหน้าจอ /home อัปเดตจาก 1 เป็น 2 "ทันที" ต่อหน้าต่อตา User

### 3. [Architecture] รักษาความแม่นยำของ Referral Linking
- ตรวจสอบให้มั่นใจว่า `referred_by_id` ถูกเขียนลงฐานข้อมูลสำเร็จก่อนที่ Onboarding API จะทำงาน (โดยใช้ลำดับของ Transaction ที่รัดกุม)

---

## ✅ การตรวจสอบความสำเร็จ (Verification)
- [ ] ประวัติใน `referral_history` ต้องไม่เบิ้ล (มีบรรทัดเดียวต่อการสมัคร 1 ครั้ง)
- [ ] กดจบ Ritual Modal แล้ว หน้า Home ต้องโชว์ดาว = 2 ทันทีโดยไม่ต้องกด Refresh เอง
- [ ] หลังจากถามคำถามแรก Stars Badge ต้องยังคงเป็น 2 (เพราะถูกหัก 1 และได้เติมคืน 1)

## Tags
`integrity` `ui-sync` `idempotency` `final-plan` `mmv-tarots`
