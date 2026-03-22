# Snapshot: Mission Blueprint - Google Login & UX Enhancement

**Time**: 2026-01-21 23:17
**Context**: แผนการ Implement Google Login แบบสมบูรณ์ แบ่งเป็น 4 Phase เพื่อความ Robust และ UX ที่ดีที่สุด (MimiVibe Style)

---

## 🛡️ Phase 1: Core Authentication (The Foundation)
**เป้าหมาย**: ทำให้ระบบจำแนกและรับรองสิทธิ์ผ่าน Google ได้จริง
- **Backend Configuration**: 
    - อัปเดต `lib/server/auth.ts` เพิ่ม `google` ใน `socialProviders`
    - กำหนด `mapProfileToUser` เพื่อดึง `name`, `email`, และ `image` ให้ตรงกับ Schema เดิม
- **Client Library**:
    - อัปเดต `lib/client/auth-client.ts` (ถ้าจำเป็น) เพื่อให้มั่นใจว่า Shared Client เข้าถึง Provider ใหม่ได้

## 🎨 Phase 2: UX/UI Refinement (The Sacred Visuals)
**เป้าหมาย**: ปรับปรุงหน้า Login ให้รองรับหลายตัวเลือกโดยไม่รก (維持 Modern Glassmorphism)
- **UX Update**:
    - จากเดิมที่มีปุ่มเดียว (LINE) จะปรับเป็น **"Vertical Social Stack"** หรือ **"Choice Modal"**
    - **UX Logic**: เพิ่มสถานะ `isLoggingInGoogle` และ `isLoggingInLine` แยกกันใน Navigation Provider เพื่อให้ Feedback (Loading Spinner) แสดงบนปุ่มที่ถูกกดจริง
- **UI Design**:
    - **Google Button**: ใช้พื้นหลังขาวใส (`bg-white/10`) ขอบสะท้อนแสง พร้อมไอคอน Google สีมาตรฐาน (เพื่อความ Trust)
    - **LINE Button**: รักษาสีเขียวเอกลักษณ์เดิมไว้

## 🛰️ Phase 3: Provider Orchestration (The Navigation)
**เป้าหมาย**: เชื่อมต่อ UI เข้ากับความสามารถของ Login
- **Navigation Provider**:
    - เพิ่มฟังก์ชัน `handleGoogleLogin` ใน `navigation-provider.tsx`
    - ปรับปรุงการส่ง `callbackURL` ให้รองรับ Referral Code (`/?ref=...`) ให้เสถียรทั้งสองช่องทาง
    - จัดการ `isLoggingIn` state ให้ครอบคลุมทุก Provider

## 🧪 Phase 4: The Hard Gate (Verification)
**เป้าหมาย**: ตรวจสอบความถูกต้อง 100%
- **Flow Test**: 
    - ทดสอบ Login ใหม่ (New User) -> เช็คการแจกดาวและระบบ Referral
    - ทดสอบ Login เดิม (Existing User) -> เช็คการ Link account (ถ้าใช้อีเมลเดียวกัน)
- **Build Pass**: รัน `npm run build` และ `npm run lint` ใน Site (mmv-tarots)

---

## 🔑 Required .env Sync Check
- [x] `GOOGLE_CLIENT_ID`
- [x] `GOOGLE_CLIENT_SECRET`

## 💡 Apply When
เมื่อพร้อมเริ่มงาน ให้รันคำสั่ง `/impl` เพื่อดำเนินการตาม Phase เหล่านี้ครับ

## 🏷️ Tags
`mmv-tarots` `auth` `google-login` `ux-ui` `blueprint`
