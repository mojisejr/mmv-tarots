# 🧶 Mission Blueprint: Fix Omise PromptPay Authentication Fail (Local)

**Local Time**: 2026-02-26 23:15 GMT+7
**Project**: `projects/mmv-tarots`
**Status**: ✅ Execution & Verification Complete (All Phases)
**Context**: Fixing `authentication_failure` during PromptPay Source creation and stabilizing Polling logic.

---

## 🔍 Grounding Summary
- **The Bug**: `POST /api/checkout/omise` คืนค่า 500 และ `authentication failed` เมื่อเลือก PromptPay
- **The Root Cause**: Omise SDK (`omise-node`) ต้องการทั้ง `publicKey` และ `secretKey` ในตอน Initialize เพื่อรองรับการเข้าถึง Resource ที่ต่างกัน:
    - `charges` ใช้ `secretKey` (ฝั่ง Server)
    - `sources` ใช้ `publicKey` (ฝั่ง Client/Vault แต่อ้างอิงผ่าน SDK ในฝั่ง Server ได้)
- **Current State**: ใน `lib/server/omise.ts` เราส่งแค่ `secretKey` ทำให้ SDK บล็อกการเรียก `sources.create`

---

## 🛠️ Implementation Plan (Phase-by-Phase)

### Phase 0: Core SDK Bridge Fix
- [x] **Modify `lib/server/omise.ts`**:
    - ปรับ `getOmiseClient()` ให้ดึง `NEXT_PUBLIC_OMISE_PUBLIC_KEY` มาพร้อมกับ `OMISE_SECRET_KEY`
    - ส่งทั้งคู่เข้า `omise({ publicKey, secretKey })`
- [x] **Enhance `getOmiseConfigState`**:
    - เพิ่มการตรวจสอบความสอดคล้องของทั้งคู่ (เช่น ต้องเป็น test mode ทั้งคู่ หรือ live mode ทั้งคู่)
    - ป้องกันการที่ลืมตั้งค่า Public Key ฝั่ง Server (ซึ่งปกติดึงมาจาก `process.env`)

### Phase 1: Robust Debugging & Observability
- [x] **Redacted Logging**: 
    - เพิ่ม Log ใน `getOmiseClient` เพื่อยืนยันว่า SDK ตัวไหนถูกสร้างขึ้นด้วย Key ชุดไหน (ใช้ `prefix...suffix` ห้าม Log ความลับ)
- [x] **Error Transformation**:
    - ใน `api/checkout/omise/route.ts`, ปรับ Error handling ให้แกะกล่อง Omise Error ออกมาดูว่า `code` คืออะไร (เช่น `authentication_failure`) เพื่อให้ Debug ง่ายขึ้นแทนที่จะพ่นแค่ `Unexpected Error`

### Phase 2: Targeted Integration Verification
- [x] **Narrow SDK Test**:
    - สร้างไฟล์ `tests/omise/auth-logic.test.ts` (หรือสคริปต์เฉพาะกิจ) เพื่อรัน `sources.create` บน Local environment จริงๆ
    - ยืนยันว่าการส่ง `publicKey` เข้า SDK แก้ปัญหา 401 Unauthorized ได้จริง

### Phase 3: System Hardening (The Hard Gate)
- [x] **Build Check**: รัน `npm run build` เพื่อให้มั่นใจว่าการเปลี่ยน Factory Pattern ไม่กระทบ SSG
- [x] **Lint Check**: รัน `npm run lint` ตรวจสอบความเรียบร้อยของโค้ดใหม่
- [x] **Transaction Integrity**: ยืนยันว่าการไหลของ Metadata ในการสร้าง Source ส่งต่อไปยัง Charge ได้ครบถ้วน

### Phase 4: Local Operations Update
- [x] **Documentation**: บันทึก "Safe Local Test Flow" สำหรับ PromptPay:
    1. รัน App บน Local
    2. สร้าง QR Code
    3. Simulate Success บน Omise Dashboard
    4. กดปุ่ม Status Reconcile ในหน้าโปรไฟล์เพื่อเติมเงิน (No Webhook Required)

### 🚀 Stabilization Patch (Post-Testing)
- [x] **Polling Logic**: แก้ไข `useEffect` ใน `PromptPayQR.tsx` ที่มีการ Reset Timer ทุกวินาที ทำให้การ Polling จริงๆ ไม่ทำงาน (Fixed dependencies)
- [x] **QR Fallback**: เพิ่มการค้นหา `qrImageUrl` จาก `charge.source` หาก `source` หลักยังไม่มีข้อมูล
- [x] **UI Loading**: แก้ไขปัญหาสถานะ Stuck Loading เมื่อ Polling เริ่มต้น

---

## 🛡️ Risk Assessment (Mitigated)
1. **Env Drift**: ตรวจสอบแล้วว่าใช้ `test` mode ทั้งคู่ใน Local ✅
2. **Credential Leak**: ใช้ `redactKey` helper เพื่อ Log เฉพาะ prefix/suffix ✅
3. **SSG Crash**: SDK initialization หุ้มด้วย try-catch และ check `typeof window` ✅

---

## 🔮 Success Criteria
- [x] `omise.sources.create` คืนค่า `src_test_...` พร้อม QR Metadata ใน Local env
- [x] ยอดเงิน Star อัปเดตผ่าน Polling API หลัง Simulate ใน Dashboard
- [x] ไม่มีการแจ้งเตือน Authentication Failed ใน Server Logs
- [x] Polling ทุก 4 วินาทีทำงานปกติ ไม่โดน Interrupt โดย Timer countdown
- [x] QR Code แสดงผลถูกต้องแม้ Omise จะคืนค่ามาล่าช้า (Fallback mapping)

---
*Logged by Oracle Keeper*
*Session ID: 2026-02-26-omise-auth-fix*
*Final Update: 23:55 (Mission Complete)*
