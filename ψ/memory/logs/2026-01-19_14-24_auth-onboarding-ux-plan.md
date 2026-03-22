# Snapshot: Robust Auth & Onboarding UX Optimization Plan

**Time**: 2026-01-19 14:24
**Context**: วิเคราะห์ปัญหา Latency จากต่างประเทศ และปัญหา UX เรื่องความไม่ชัดเจนของการได้รับแต้ม Referral/Onboarding ในโปรเจกต์ mmv-tarots

## Insight & Strategy

แผนนี้เน้นแก้ปัญหา 2 ด้าน คือ **Performance (Latency)** และ **Clarity (UX)** โดยใช้หลักการ "Delay the Heavy, Ensure the Gain"

### 1. Performance: Offload to Background
- **Auth Callback (`auth.ts`)**: ย้าย Logic การแจกแต้ม (Credit) และงาน DB หนักๆ ออกจากขั้นตอน Login หลัก เพื่อให้ User เข้าแอปได้ทันที
- **Fire & Forget**: ใช้การรัน Function แบบไม่รอ (Non-blocking) ในส่วนที่เพียงแค่ต้องการบันทึกข้อมูลเบื้องต้น (เช่น IP, Referral Link)

### 2. Robust Onboarding: The "Ritual Gate"
- **Atomic Onboarding**: ย้ายการแจกแต้ม Onboarding Bonus (+1) และ Referral Reward ไปไว้ที่ `PATCH /api/user/onboarding`
- **Guaranteed Reward**: ตราบใดที่ User ยังไม่ได้กด "รับพร" (Complete Ritual) ระบบจะไม่ถือว่า Onboarding สำเร็จ และจะเด้งกล่อง Ritual ขึ้นมาใหม่เสมอเมื่อเข้าเว็บ เพื่อป้องกันกรณี User ปิดกล่องหนีหรือ Connection หลุด

### 3. UX Clarity: Visual Confirmation
- **Transparency**: แสดงผลใน `WelcomeModal` ให้ชัดเจนว่า User กำลังจะได้รับแต้มกี่แต้ม (เช่น "ได้รับ 1 แต้มเริ่มต้น + 1 แต้มจากเพื่อน")
- **Visual Feedback**: เพิ่ม Toast หรือ Animation แจ้งเตือนเมื่อได้รับแต้มสำเร็จ เพื่อลดความสงสัยที่ว่า "ตกลงได้แต้มหรือยัง?"
- **Referrer Notification**: เตรียมแผนการแสดงผลในหน้า History/Profile สำหรับคนชวน ให้เห็นว่าเพื่อนคนไหนสมัครสำเร็จและได้รับแต้มแล้ว

## Apply When

- เมื่อต้องการปรับปรุงระบบ Auth และ Referral ให้รองรับ User จำนวนมากหรือ User จากต่างประเทศ
- เมื่อได้รับ Feedback เรื่องความสับสนของระบบแต้มและรางวัล

## Tags

`auth` `ux` `onboarding` `referral` `latency` `mmv-tarots` `robustness`
