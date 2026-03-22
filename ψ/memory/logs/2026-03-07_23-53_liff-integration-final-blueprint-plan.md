# Snapshot: LIFF Integration & Manual Payment Blueprint

**Time**: 2026-03-07 23:53 +0700
**Context**: Finalized mission blueprint for LIFF Integration (Phase 4 completed) and Manual Payment Pivot (Phase 5 pending) for mmv-tarots.

# Mission Blueprint: LINE LIFF 100% Integration & Manual Payment Pivot

**Mission ID**: `#MMV-LIFF-01`
**Project**: `mmv-tarots`
**Status**: ⚒️ Phase 3 In-Progress (Oracle Architect)
**Timestamp**: 2026-03-06 23:10 GMT+7

---

## ✅ Phase 1: Console Optimization (DONE)
*คุณนนท์ตั้งค่าใน LINE Developers Console เรียบร้อยแล้ว (Sept 2024)*

- [x] **1.1 Messaging API (The Gatekeeper)**: เชื่อมต่อผ่าน OA Manager ภายใต้ Provider เดียวกับ LINE Login สำเร็จ
- [x] **1.2 Linked OA (Seamless Auto-Add)**: ตั้งค่าเชื่อมต่อใน LINE Login Channel เรียบร้อย
- [x] **1.3 LIFF App Registration**: สร้าง LIFF App (`mmv-tarots-web`) พร้อมระบุ Endpoint และ Scopes สำเร็จ

---

## ✅ Phase 2: Environment Variables (DONE)
*ระบุข้อมูลใน `.env.local` ของ project `mmv-tarots` ครบถ้วน*

- [x] **NEXT_PUBLIC_LIFF_ID**: Ready
- [x] **LINE_CHANNEL_ACCESS_TOKEN**: Ready
- [x] **LINE_OA_ID**: Ready
- [x] **LINE_CHANNEL_ID**: Ready

---

## 🛠 Phase 3: Implementation - Client Side (NEXT UP)
1.  **Dependencies**:
    *   `npm install @line/liff` (Done)
2.  **LiffProvider (`components/providers/liff-provider.tsx`)**:
    *   ทำ Initialization `liff.init()` เมื่อคอมโพเนนต์ Mount.
    *   ตรวจจับ `liff.getOS()` และ `liff.isInClient()`.
    *   ถ้า `isInClient()` ให้ทำการ `liff.login()` (ถ้ายังไม่ได้ล็อกอิน).
    *   ดึง `liff.getAccessToken()` เพื่อส่งให้ Backend.
3.  **Auth Sync Logic**:
    *   หากได้ Access Token มาแล้ว ให้ยิง POST ไปที่ `/api/auth/liff-verify`.
    *   หลังจาก Verify สำเร็จ ให้ทำการ `window.location.reload()` เพื่อ Update Auth State.

## Phase 4: Implementation - Server Side (Better-Auth Bridge)
1.  **Liff Verify API (`app/api/auth/liff-verify/route.ts`)**:
    *   **Input**: `accessToken` จาก Client.
    *   **Verification**: ส่ง GET ไปที่ `https://api.line.me/oauth2/v2.1/verify?access_token={token}`.
    *   **User Lookup**: ใช้ `sub` (LINE User ID) จากผลลัพธ์มาค้นหา User ใน Prisma.
    *   **Session Creation**: ใช้ `auth.api.createSession` (จาก `better-auth`) เพื่อสร้าง Session จริงให้ User.

## Phase 5: Manual Payment UI & Notification
1.  **Payment Refactor**:
    *   แสดง **Static QR Code** (PromptPay) พร้อมเลขบัญชี.
    *   เพิ่มช่องทาง **Submit Slip** (ยิงรูปเข้า API หรือส่งเข้า LINE OA โดยตรง).
2.  **Admin Portal**:
    *   หน้า Approve รายการโอนเงิน.
    *   เมื่อ Admin กด Approve -> ยิง Push Message ผ่าน Messaging API ไปหา User: *"รับดาวเรียบร้อยแล้ว! 🌟 ไปเช็กดวงกันเลย"*

---

## 🧾 Status Update (Append-Only)
**Timestamp**: 2026-03-07 23:11:39 +07
**Branch**: `staging`

### ✅ Phase 3 Marked Done
- [x] Dependency `@line/liff` installed and locked.
- [x] Added `components/providers/liff-provider.tsx`.
- [x] Integrated `LiffProvider` in `app/layout.tsx`.
- [x] Implemented auth sync call to `POST /api/auth/liff-verify` with reload-on-success path.

### Quality Gate Result
- ✅ `npm run lint` passed
- ✅ `npm run build` passed
- ⚠️ `npm run test` not green (baseline project failures: 61 files / 92 tests)

### Next Gate
- Phase 4 required: implement `app/api/auth/liff-verify/route.ts` to complete LIFF -> Better-Auth server bridge.

---

## 🧾 Status Update (Append-Only)
**Timestamp**: 2026-03-07 23:24:56 +07
**Branch**: `staging`

### ✅ Phase 4 Marked Done
- [x] Added `app/api/auth/liff-verify/route.ts`.
- [x] Implemented LINE Access Token verify (`/oauth2/v2.1/verify`).
- [x] Implemented LINE profile fetch (`/v2/profile`) for identity mapping.
- [x] Implemented user/account linkage in Prisma (`providerId: line`, `accountId: userId`).
- [x] Implemented session creation in DB + signed Better-Auth cookie issuance.

### Quality Gate Result
- ✅ `npm run lint` passed
- ✅ `npm run build` passed
- ⚠️ `npm run test` not green (baseline project failures: 61 files / 92 tests)

### Next Gate
- Phase 5: Manual Payment UI & Notification.

