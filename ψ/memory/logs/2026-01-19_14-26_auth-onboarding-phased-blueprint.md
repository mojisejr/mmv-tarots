# Snapshot: Mission Blueprint - Robust Auth & Phased Onboarding

**Time**: 2026-01-19 14:26
**Context**: ปรับปรุงแผนงาน mmv-tarots ให้เป็นแบบ Feature + Phases เพื่อให้ง่ายต่อการ Implementation สำหรับแก้ปัญหา Latency และ UX Clarity

---

## 🏗️ Phase-Based Implementation Plan

### Phase 1: Core Performance (Backend Decoupling)
**เป้าหมาย**: ทำให้ Login เร็วที่สุดโดยไม่ต้องรอ Logic อื่นๆ
- **Feature: Non-blocking Auth Hook**
  - แก้ไข `lib/server/auth.ts`: ให้อ่านแค่ Metadata (IP, Referral link) แล้วส่งต่อไปยัง Background process
  - **Action**: เปลี่ยน `await referralService.processReferralSignup` เป็นการเรียกแบบไม่รอ (Fire & Forget) หรือเตรียมส่งต่อให้ Phase 2
  - **Result**: ลด Latency จาก 2-3 วินาที เหลือเพียงระดับมิลลิวินาทีสำหรับ Login process

### Phase 2: The Ritual Gate (Reward Guaranteed)
**เป้าหมาย**: ย้ายการแจกรางวัลมาไว้ที่ขั้นตอนการ Confirm ของ User
- **Feature: Reward-Enabled Onboarding API**
  - แก้ไข `app/api/user/onboarding/route.ts`: เพิ่ม Logic การตรวจสอบและแจกแต้ม Onboarding Bonus และ Referral Bonus ที่นี่
  - **Action**: เมื่อ User กด "รับพร" ระบบจะทำการ Link Referral และแจก Stars ให้ทั้งคู่
  - **Result**: งานเขียน DB หนักๆ จะเกิดขึ้นเมื่อ User พร้อมรอ และประกันว่า User จะได้รับแต้มอย่างแน่นอน

### Phase 3: Visual Confirmation UI (UX Clarity)
**เป้าหมาย**: ทำให้ User มั่นใจว่า "ได้แต้มจริง"
- **Feature: Dynamic Welcome Gift Step**
  - แก้ไข `WelcomeModal.tsx`: ใน Step 'gift' ให้แสดงผลจำนวนแต้มที่จะได้รับตามจริง (เช่น "แม่หมอขอมอบ 1 ดาวให้คุณ + 1 ดาวจากคำแนะนำของเพื่อน")
  - **Feature: Success Ritual Animation**
  - แก้ไข `WelcomeRitual.tsx`: เพิ่มการแสดงผล Toast หรือ Success animation ที่ชัดเจนเมื่อได้รับแต้มสำเร็จ
  - **Result**: User รับรู้ถึงมูลค่าที่ได้รับทันที ลดอัตราความสงสัยในระบบ

### Phase 4: Social Proof & History (Transparency)
**เป้าหมาย**: ให้คนชวน (Referrer) เห็นความเคลื่อนไหว
- **Feature: Referral Transaction Labels**
  - แก้ไขหน้า `HistoryPage`: แสดงผล Transaction ที่มาจาก "Referral Reward" ให้ชัดเจน
  - **Result**: รักษาสายสัมพันธ์และความเชื่อมั่นให้กับกลุ่มผู้ใช้ที่ช่วยขยายฐานผู้ใช้ (Referrers)

---

## 🛡️ Risk Management
- **Risk**: User ปิดกล่องก่อนกด Complete
- **Mitigation**: ระบบจะไม่เซต `onboardingCompleted: true` จนกว่า API จะรันสำเร็จ ทำให้กล่องจะเด้งใหม่เสมอ (Persistence)
- **Risk**: API Error ระหว่างแจกแต้ม
- **Mitigation**: ใช้ DB Transaction ใน Service layer เพื่อให้มั่นใจว่า "ได้ทั้งคู่ หรือไม่ได้เลย" และแจ้งเตือนให้ User ลองใหม่

## Tags
`auth` `onboarding` `referral` `latency` `ux` `mmv-tarots` `blueprint`
