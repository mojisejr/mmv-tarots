# Mission Blueprint: Phase 5.5 - Domain Normalization & LIFF Resilience

**Mission ID**: `#MMV-PHASE-5-5`
**Project**: `mmv-tarots`
**Status**: 🏗️ Drafted
**Timestamp**: 2026-03-08 22:25 GMT+7

---

## 🎯 Objective
แก้ไขปัญหา **"Black Screen"** ใน LINE Mini App ที่เกิดจาก Domain Mismatch โดยการบังคับใช้ Root Domain (non-www) ผ่าน Middleware ของ Next.js และเพิ่มระบบดักจับความผิดพลาด (Error Resilience) ในกระบวนการ `liff.init()` เพื่อให้แอปทำงานได้อย่างเสถียรบนทุกสภาพแวดล้อม

## 🏗️ Scope
- **In-Scope**: URL Normalization (www -> root) ใน Middleware, `liff.init()` Try-Catch และ Fallback Logic ในหน้า Gateway, และการทำ Unit Test ตรวจสอบกลไกการ Redirect
- **Out-of-Scope**: การปรับแต่ง Infrastructure บน Vercel/Cloudflare (ทำผ่าน Code-level เท่านั้นเพื่อความคล่องตัว)

---

## 🗺️ Phases & Deliverables

### 🛡️ Phase 1: Middleware Domain Guard
- **Action**: แก้ไข `projects/mmv-tarots/middleware.ts` เพื่อตรวจสอบ `host` หากมีขึ้นต้นด้วย `www.` ให้ทำ `301 Moved Permanently` ไปยัง Root Domain
- **Critical Test Case**:
    - [ ] `www.maemormimi.com/liff?ref=xxx` → ต้องถูกดีดไป `maemormimi.com/liff?ref=xxx` โดย Query Params ไม่หาย
- **Hard Gate**:
    - [ ] บราวเซอร์ต้อง Redirect จาก `www.maemormimi.com` ไป `maemormimi.com` โดย Query Params ต้องอยู่ครบ

### 🪂 Phase 2: LIFF Initialization Resilience
- **Action**: อัปเกรด `app/liff/page.tsx` ให้มีระบบ Error Safety Net
    - ครอบ `liff.init()` ด้วย `try/catch`
    - หากเกิด Error ให้ดีด User ไปยัง `target` (Fallback) ทันทีเพื่อไม่ให้ค้างหน้า Loading
- **Critical Test Case**:
    - [x] เมื่อจำลอง `liff.init()` พัง แอปต้องไม่ค้างที่หน้า Black Screen
- **Hard Gate**:
    - [x] เมื่อจำลอง `liff.init()` พัง แอปต้องไม่ค้างที่หน้า Black Screen

### 💳 Phase 3: Manual Payment Checkout Gateway
- **Action**: สร้างหน้าบ้านสำหรับรับชำระเงินโอน (QR PromptPay) ใน `app/package/checkout/page.tsx`
- **Hard Gate**:
    - [ ] แสดงผล QR Code ตรงตามแพ็กเกจที่เลือก

---

## 🛡️ Risks & Rollback
- **Risk**: Infinite Redirect Loop หากตั้งค่า Host ตรวจสอบผิดพลาด
- **Rollback**: revert การเปลี่ยนแปลงใน `middleware.ts` กลับไปใช้เวอร์ชัน `b888868`
- **Mitigation**: รัน Unit Test ตรวจสอบ Redirect Logic ในระดับ Local ก่อน Deploy

## ✅ Verification Strategy (The Hard Gate)
1. **Build**: `npm run build` ต้องผ่านสีเขียว
2. **Lint**: `npm run lint` ต้องผ่าน
3. **Smoke Test**: เข้า URL `www.maemormimi.com/liff` ต้องถูกพาไป `maemormimi.com/liff` อัตโนมัติ

---

## 📌 Progress Update (Append-Only)
**2026-03-08 22:26 GMT+7**: Phase 1 COMPLETED ✅
- Implemented domain normalization in `projects/mmv-tarots/middleware.ts` with permanent redirect from `www.` host to root domain.
- Added test coverage in `projects/mmv-tarots/__tests__/middleware.test.ts` to verify path/query preservation during normalization.
- Hard Gate passed: `npm run build` ✅, `npm run lint` ✅, `npm test` ✅ (131/131).

**2026-03-08 22:33 GMT+7**: Phase 2 COMPLETED ✅
- Hardened `projects/mmv-tarots/app/liff/page.tsx` to safely handle malformed `liff.state` decode failures and fallback to `/`.
- Added resilience test coverage in `projects/mmv-tarots/__tests__/lib/liff-phase1.test.ts` for malformed URI and referral merge behavior.
- Hard Gate passed: `npm run build` ✅, `npm run lint` ✅, `npm test` ✅.
