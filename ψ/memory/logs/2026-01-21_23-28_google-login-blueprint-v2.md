# Snapshot: Mission Blueprint - Google Login & UX Enhancement (V2 - Truth Based)

**Time**: 2026-01-21 23:28
**Context**: แผนการ Implement Google Login ฉบับปรับปรุงตามข้อมูลจริงจาก Codebase และ Better Auth Docs เพื่อความสมบูรณ์สูงสุด

---

## 🛡️ Phase 1: Robust Auth Foundation (Backend)
**เป้าหมาย**: ระบบ Authentication ที่รองรับ Multi-provider และการเชื่อมโยงบัญชี
- **Account Linking (Critical)**: 
    - เปิดใช้งาน `account.accountLinking` ใน `lib/server/auth.ts` เพื่อป้องกันปัญหาอีเมลซ้ำจากต่าง Provider
- **Provider Config**:
    - เพิ่ม `google` ใน `socialProviders` โดยใช้ `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET`
    - เพิ่ม `mapProfileToUser` สำหรับ Google เพื่อดึงข้อมูล Profile ที่ถูกต้อง
- **Security Check**: ตรวจสอบการจัดการ `BETTER_AUTH_SECRET` และ `BETTER_AUTH_URL` ให้เสถียร

## 🛰️ Phase 2: Logic & Orchestration (Client)
**เป้าหมาย**: ปรับปรุงฟังก์ชันการเรียกใช้งานจาก Client ให้ยืดหยุ่น
- **Navigation Provider Refactor**:
    - แก้ไข `handleLoginClick` ใน `lib/client/providers/navigation-provider.tsx` ให้รับตัวแปร `provider: 'line' | 'google'`
    - เปลี่ยนจาก `isLoggingIn: boolean` เป็น `loggingProvider: 'line' | 'google' | null` เพื่อจัดการสถานะการรอแยกปุ่มกัน
- **Referral Continuity**: 
    - รักษา Logic การดึง `ref` จาก URL และส่งเข้าไปใน `callbackURL` เพื่อให้ระบบแจกรางวัล (Referral Hooks) ทำงานได้เสถียรทั้งสองช่องทาง

## 🎨 Phase 3: Sacred Visuals (UX/UI Enhancement)
**เป้าหมาย**: หน้า Login ที่สวยงามตามสไตล์ MimiVibe และใช้งานง่าย (Mobile-Friendly)
- **UI Stack**: 
    - เปลี่ยนจากปุ่มเดี่ยวเป็น **Vertical Social Stack**
    - เพิ่ม **"Decorative Divider"** (เช่น `--- หรือเข้าสู่ระบบด้วย ---`) เพื่อแบ่งสัดส่วน
- **Visual Design**:
    - **Google Button**: ใช้สไตล์ Glassmorphism สีขาวใส (`bg-white/10`, `border-white/20`) แสดงให้เห็นถึงความสว่างและความเชื่อถือ
    - **LINE Button**: ใช้สีแบรนด์ LINE อ่อนๆ (`bg-[#06C755]/10`, `border-[#06C755]/20`) เพื่อรักษา Identity
- **Feedback**: แสดง Loading Spinner เฉพาะบนปุ่มที่ User กำลังใช้งานจริง

## 🧪 Phase 4: The Integrity Gate (Verification)
**เป้าหมาย**: ตรวจสอบความถูกต้อง 100% ก่อนส่งมอบ
- **Cross-Account Test**: ทดสอบการ Link บัญชี LINE และ Google ที่ใช้อีเมลเดียวกัน
- **Referral Test**: ตรวจสอบว่า `ref` code ยังทำงานและมีการแจก Stars ผ่าน Background Hooks หลัง Login
- **Hard Gate**: 
    - `npm run build` ใน `projects/mmv-tarots`
    - `npm run lint` ตรวจสอบ Syntax และ Type Safety

---

## 🔑 .env Dependency
- [x] `GOOGLE_CLIENT_ID`
- [x] `GOOGLE_CLIENT_SECRET`
- [x] `BETTER_AUTH_URL` (Check local vs prod)

## 🏷️ Tags
`mmv-tarots` `auth` `google-login` `ux-ui` `account-linking` `blueprint-v2`
