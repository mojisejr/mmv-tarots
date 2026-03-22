# Mission Blueprint: Phase 5 - Auth & Session Hardening (REVISED V3)

**Mission ID**: `#MMV-PHASE-5`
**Project**: `mmv-tarots`
**Status**: ⚒️ Executing Step 1
**Timestamp**: 2026-03-08 13:40 GMT+7

---

## 🎯 Objective
สร้างระบบ Login และ Session Management ผ่าน LINE LIFF ให้มีความเสถียร (Robust) 100% และลดความซับซ้อน (Clean up) เพื่อป้องกันปัญหา Redirect วนลูป, ระบบ Login ซ้อนทับ และอัปเกรดระบบ Referral ให้ทำงานร่วมกับ LIFF ได้อย่างไร้รอยต่อ

## 🏗️ Scope
- **In-Scope**: สร้างหน้า `/liff` เฉพาะ, ปรับปรุง Redirect ใน `LiffProvider`, เขียนทับปุ่ม Login เป็น LIFF Flow, ยกระดับ Middleware, และปรับปรุง URL Generator ของระบบ Referral ให้ใช้ LIFF Scheme (`https://liff.line.me/{id}`)
- **Out-of-Scope**: ระบบชำระเงินจริง (Deferred to Phase 5.4+), ระบบตรวจสอบสลิปอัตโนมัติ (Phase 6)

---

## 🗺️ Phases (Architectured for 100% LIFF-First)

### 🧹 Phase 5.1: Clean up & Universal LIFF Entry
- [ ] **app/liff/page.tsx**: สร้างหน้า Entry Point เพื่อรองรับ `?liff.state={path}` และแสดง Loading State สไตล์ Mimi Vibe เพื่อแก้ปัญหา 404
- [ ] **Clean Up Old Login**: 
    - ไปที่ `lib/client/providers/navigation-provider.tsx` แก้ไข `signIn.social({ provider: 'line' })` เดิม
    - เปลี่ยนให้ปุ่ม "เข้าสู่ระบบ" ผูกกับการสั่งงาน `liff.login()` (หรือ Redirect ไปหน้า `/liff`) เพื่อรวบกระบวนการ Auth ไว้ที่คอขวดเดียว

### 🤝 Phase 5.2: Referral System Upgrade (LIFF Wrapped)
- [x] **lib/referral-utils.ts**: 
    - แก้ไข `generateLink` ให้พ่น URL ในรูปแบบ `https://liff.line.me/{LIFF_ID}/?ref={CODE}` แทน origin ตรงๆ
- [x] **LIFF State Referral Catching**: 
    - ตรวจสอบให้แน่ใจว่าเมื่อได้รับ `liff.state` ที่มี `?ref=` ติดมาด้วย ระบบ (หน้า `/liff` หรือ Provider) จะส่งต่อ Query param นี้ให้ `middleware.ts` จับลง Cookie `mmv_ref` ได้สำเร็จ

### 🛡️ Phase 5.3: Smart Redirect & Middleware Enforcer
- [x] **LiffProvider.tsx Update**: 
    - ตัด `window.location.reload()` ทิ้งแบบถาวร
    - ประยุกต์ใช้ Next.js `useRouter().replace()` ในการพา User ไปยัง `liff.state` (เช่น ไป `/history` หลัง Login)
- [x] **middleware.ts Enforcer**: 
    - อัปเกรดให้ตรวจเช็คคุกกี้ Session (`mmv_auth.session_token` / `__Secure-mmv_auth.session_token`)
    - บังคับ Redirect เข้าสู่กระบวนการ Auth (วิ่งไป `/liff`) หากพยายามเข้าถึง Protected Routes (`/profile`, `/history`, `/package`, `/submitted`)

### 🧪 Phase 5.4: Essential Unit Testing (Verify Hardening)
*เป้าหมาย: เขียน Unit Test เฉพาะจุดที่สำคัญที่สุดเพื่อยืนยันว่ากลไกการ Hardening ทำงานถูกต้อง 100%*
- [x] **Test Referral Wrapper**: เขียนเทสต์สำหรับ `ReferralUtils.generateLink` ให้พ่น LIFF-wrapped URL (`https://liff.line.me/{ID}/...`) ได้ถูกต้องทุก Case (Home, Sub-path, with/without ref)
- [x] **Test Middleware Protection**: เขียนเทสต์สำหรับ `middleware.ts` เพื่อ Check:
    - [x] การจัดเก็บ `mmv_ref` cookie เมื่อมี query `ref`
    - [x] การ Redirect ไป `/liff` เมื่อเข้า Protected Routes โดยไม่มี Session
    - [x] การอนุญาตให้ผ่านได้เมื่อมี Session ถูกต้อง
- [x] **Test LIFF Gateway Logic**: เขียนเทสต์จำลองหน้า `/liff` (ผ่าน component/hook test ชิ้นส่วนที่เกี่ยวข้อง) เพื่อเช็ค:
    - [x] การดึง `liff.state` มาใช้เป็น Redirect Target
    - [x] การส่งต่อ Query parameters ไปยังปลายทางโดยไม่ตกหล่น

### 💳 Phase 5.5: Manual Payment UI (Deferred)
- [ ] **PromptPay QR UI**: หน้าแสดง QR ชำระเงินแพ็กเกจ
- [ ] **Slip Submission API**: API สำหรับบันทึกรายการโอนลง DB เพื่อรอ Admin อนุมัติ

---

## ✅ Exit Criteria (Hard Gates)
1. ไม่มีร่องรอยการเรียกใช้ `signIn.social(...)` ในแอป (รวบเป็น 1 คอขวดของ LIFF)
2. เมื่อคลิกลิงก์ Referral แบบใหม่ (`liff.line.me/.../?ref=`) ใน LINE ต้องเปิด Mini App ล็อกอินไว และเก็บบันทึก `mmv_ref` ลงคุกกี้ได้สำเร็จ 
3. เมื่อเข้าลิงก์ตรง `liff.line.me/{id}/profile` ระบบตั้งเป้า Redirect ไปเจอหน้า Profile ทันทีโดยไม่ค้างที่หน้า Homepage
4. Middleware สามารถป้องกันหน้าที่ต้องล็อกอินได้ถูกต้อง
5. `npm run build` และ `npm run lint` ผ่านสีเขียว 100%

---

## 📝 Status Update (Append-Only)
**2026-03-08 13:02**: Blueprint Created.
**2026-03-08 13:25**: Strategic Pivot to Auth Hardening.
**2026-03-08 13:30**: V2 Patch - Added explicit Clean up phase to remove dual-standard login flows.
**2026-03-08 13:40**: V3 Patch - Inserted Phase 5.2 (Referral System Upgrade) to explicitly handle LIFF Wrapped Links and parameter catching. Ready for execution.
**2026-03-08 14:37**: Phase 5.1 Implemented ✅ - Added `app/liff/page.tsx` as universal LIFF entry gateway and replaced legacy `signIn.social(...)` login path with `/liff?liff.state=...` routing in `navigation-provider`.
**2026-03-08 14:37**: Validation ✅ - `npm run build`, `npm run lint`, `npm test` passed (18 files, 116 tests) after patch.
**2026-03-08 14:42**: Phase 5.2 Implemented ✅ - Updated `ReferralUtils.generateLink` to produce LIFF-wrapped links and added gateway target builder to preserve/forward `ref` from `liff.state` pathing.
**2026-03-08 14:42**: Validation ✅ - `npm run build`, `npm run lint`, `npm test` passed (19 files, 121 tests) after patch.
**2026-03-08 14:58**: Phase 5.3 Implemented ✅ - Upgraded Middleware with Auth Enforcer for protected routes and optimized `LiffProvider` to handle `liff.state` transitions without redundant reloads.
**2026-03-08 14:58**: Validation ✅ - Created `middleware.test.ts` (5/5 pass), `npm run build` and `npm run lint` PASSED.
**2026-03-08 15:09**: Phase 5.4 Implemented ✅ - Added essential unit test coverage for referral wrapper edge-cases, middleware redirect/query preservation, and LIFF gateway query forwarding.
**2026-03-08 15:09**: Validation ✅ - `npm test` passed (20 files, 130 tests), `npm run lint` PASSED, `npm run build` PASSED.
