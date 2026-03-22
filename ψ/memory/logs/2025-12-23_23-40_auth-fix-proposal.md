---
type: snapshot
project: mmv-tarots
topic: auth-fix-proposal
status: planning
---

# Snapshot: ข้อเสนอการแก้ไขระบบ Authentication และ User Flow (mmv-tarots)

**เวลา**: 2025-12-23 23:40 GMT+7
**บริบท**: สรุปแนวทางการแก้ปัญหา Authentication mismatch ระหว่าง Client และ Server ที่พบจากการวิเคราะห์ User Journey

## รายการปัญหาที่ต้องแก้ไข (Problem List)
1. **Home Submit Mismatch**: หน้า Home ยอมให้ส่งคำถามโดยไม่เช็คสถานะการล็อกอิน แต่ API บล็อก (401) ทำให้เกิด UX ที่ไม่ชัดเจน
2. **Generic Error Handling**: ระบบจัดการ Error 401 แบบรวม ๆ ทำให้ผู้ใช้ไม่ทราบว่าต้องล็อกอินเพื่อใช้งานต่อ
3. **Missing Route Protection**: หน้าที่ควรเป็น Private (Profile, History) ยังไม่มีการจัดการสถานะ Unauthenticated ที่ดีพอ

## ข้อเสนอการแก้ไข (Proposed Fixes)

### 1. Home Page (Auth UX)
- **Action**: เพิ่มการตรวจสอบ `isLoggedIn` ในฟังก์ชัน `handleQuestionSubmit`
- **UX**: หากยังไม่ล็อกอิน ให้แสดง Modal หรือข้อความแจ้งเตือนพร้อมปุ่ม "เข้าสู่ระบบด้วย LINE" แทนการส่งคำถามไปยัง API
- **Goal**: ป้องกันการเรียก API ที่จะล้มเหลวแน่นอน และนำทางผู้ใช้เข้าสู่ระบบอย่างถูกต้อง

### 2. Client API Layer (Error Classification)
- **Action**: ปรับปรุง `lib/client/api.ts` ให้ตรวจจับ HTTP 401
- **Implementation**: โยน `AuthError` หรือคืนค่าสถานะที่ระบุชัดเจนว่าเป็นปัญหาด้านสิทธิ์การเข้าถึง
- **Goal**: ช่วยให้ UI สามารถแยกแยะระหว่าง "ระบบขัดข้อง" กับ "ยังไม่ได้ล็อกอิน" ได้

### 3. History & Profile Pages (Auth State UI)
- **Action**: ปรับปรุงการแสดงผลเมื่อ `fetchUserPredictions` คืนค่า 401
- **UX**: แสดง Empty State ที่สวยงามพร้อมข้อความ "เข้าสู่ระบบเพื่อดูประวัติการทำนายของคุณ" และปุ่ม Login
- **Goal**: เปลี่ยน Error ให้เป็นโอกาสในการดึงดูดผู้ใช้ (Conversion point)

### 4. Global Navigation & Middleware
- **Action**: พิจารณาใช้ Next.js Middleware หรือ Higher-Order Component (HOC) เพื่อป้องกันการเข้าถึงหน้า Profile/History โดยไม่ล็อกอิน
- **Goal**: สร้างมาตรฐานความปลอดภัยที่สม่ำเสมอทั่วทั้งแอป

## ลำดับการดำเนินงาน (Execution Roadmap)
1. **Step A**: แก้ไข `app/page.tsx` เพื่อเพิ่ม Auth Check ก่อน Submit
2. **Step B**: ปรับปรุง `lib/client/api.ts` และ UI ในหน้า History/Profile
3. **Step C**: เพิ่ม Integration Tests เพื่อยืนยัน Auth Flow ทั้งหมด

---
**Oracle Note**: การทำให้รอยต่อของ Auth เรียบเนียน (Seamless) คือหัวใจสำคัญของความน่าเชื่อถือในสายตาผู้ใช้
