# Snapshot: Auth & Referral Latency Analysis

**Time**: 2026-01-19 06:55
**Context**: วิเคราะห์ปัญหา user รอนานหลังจากกด Login ที่หน้าแรก (mmv-tarots) โดยเฉพาะเมื่อมี Referral link

## Insight

จากการตรวจสอบโค้ดใน `lib/server/auth.ts` และ `referral-service.ts` พบว่า:
1.  **Heavy Callbacks**: กระบวนการสร้าง User ใหม่ (`user.create.after`) มีการรันหลายอย่างพร้อมกัน:
    *   `processReferralSignup` (ค้นหา Master User, สร้าง Referral record)
    *   `logUserIP` (บันทึก IP ลง DB)
    *   `updateOnboardingBonus` (สร้าง Wallet/Transaction)
2.  **UI Silence**: ใน Client side (`navigation-provider.tsx`), ฟังก์ชัน `handleLoginClick` ไม่มีการ set state ว่ากำลังโหลด ทำให้ปุ่มดู "นิ่ง" จนกระทั่งหน้าจอเปลี่ยนทางไปยัง LINE OAuth
3.  **Better Auth Behavior**: คำสั่ง `signIn.social` จะเรียก API ของ Better Auth ซึ่งอาจใช้เวลาประมวลผลระยะหนึ่งก่อนจะสั่ง Redirect

## Proposed Fix

1.  **Client-side Feedback (Priority 1)**: เพิ่ม Spinner ในปุ่มทันทีที่กด เพื่อบอก user ว่า "ระบบรับทราบแล้ว กำลังพาไป"
2.  **State Management**: ใช้ `NavigationProvider` ในการควบคุมระดับ Global เพื่อให้ทุกส่วนของแอป (เช่น Sidebar หรือ Home) รู้ว่ากำลังอยู่ในสถานะ Logging In

## Tags

`auth` `ux` `latency` `referral` `mmv-tarots`
