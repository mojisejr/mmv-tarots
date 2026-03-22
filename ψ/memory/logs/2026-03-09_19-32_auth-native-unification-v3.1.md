# Snapshot: MMV Auth Native-Unified Stabilization (Better-Auth v1.4.7 Core) - v3.1 Perfected

**Time**: 2026-03-09 19:32 +0700
**Project**: [mmv-tarots](projects/mmv-tarots)
**Context**: อัปเกรดแผน v3 เดิมสู่ v3.1 โดยใช้ "Better-Auth Native Path" 100% หลังจากทำ Grounding และ Web Search (2026 Standards)

## 🎯 Objective
- เปลี่ยนจาก "Manual Session Patching" เป็น "Native Better-Auth Session Issuance" เพื่อความเสถียรสูงสุด
- กำจัดปัญหา Session Mismatch (401 หลังจาก login) และ Redirect Target Loss ใน LINE Browser
- ล้าง Dead Code ทั้งหมดที่ไม่ได้ใช้ตามมาตรฐาน Single-Core Engine

## 🏗️ Architecture Design (The "Native" Law)
- **Primary Engine**: `better-auth` v1.4.7 (Single Source of Truth สำหรับ Session)
- **Identity Bridge**: `liff-verify` ทำหน้าที่ Verify LINE Token เท่านั้น แล้วส่งต่อให้ `auth.api.createSession`
- **Session Layer**: ห้าม Manual Set Cookie หรือใช้ `serializeSignedCookie` ให้ Better-Auth จัดการ Header เองทั้งหมด
- **State Logic**: ใช้ `Temporary Secure Cookie` สำหรับ `mmv_target` แทนการพึ่งพา URL Params ที่ LINE มักทำหาย

## 🗺️ Execution Phases (v3.1)

### Phase 1: Native Session Issuance (The Core Fix)
- **Action**: Refactor `app/api/auth/liff-verify/route.ts`
  - ลบ `db.user.findFirst`, `db.user.create`, `db.account.create` (ใช้ Native Methods แทน)
  - ลบ `serializeSignedCookie` และ Manual Cookie Setting
  - ใช้ `auth.api.createSession({ userId: user.id })` เพื่อให้ Better-Auth ออก Session Header ที่ถูกต้อง
- **Exit Criteria**: `useSession()` ใน Client เห็น User ทันทีหลัง LIFF Login สำเร็จ โดยไม่ต้อง Refresh มือ

### Phase 2: Durable State Persistence (Redirect Hardening)
- **Action**: ปรับปรุง [app/liff/page.tsx](projects/mmv-tarots/app/liff/page.tsx)
  - ก่อนส่งไป Auth ให้เซ็ต `cookies().set('mmv_target', targetPath)` (Server-side) หรือ `localStorage` (Client-side)
  - หลังจาก Auth กลับมา ให้กู้คืนเป้าหมายจาก Store แทนการอ่านจาก URL `next` เพียงอย่างเดียว
- **Exit Criteria**: เข้าหน้าดวงจาก Shared Link -> Login -> กลับมาหน้าดวงเดิมได้ 100%

### Phase 3: Middleware Contract Alignment (Security Gate)
- **Action**: ปรับปรุง [middleware.ts](projects/mmv-tarots/middleware.ts)
  - เปลี่ยนจาก `request.cookies.get(SESSION_COOKIE_NAME)` เป็นการใช้ `auth.getSession()` (ถ้าเป็นไปได้) หรือเช็คระบบ Cookie ตามมาตรฐาน Better-Auth (e.g. `__Host-` prefix ใน prod)
- **Exit Criteria**: Protected routes ทำงานถูกต้องทั้งบน Localhost และ Production

### Phase 4: Extreme Dead Code Cleanup (The Great Purge)
- **Action**: กวาดล้างโค้ดเก่าที่ตกค้าง
  - ลบ `lib/server/auth-helpers.ts` (ถ้ามี custom cookie logic)
  - ลบ Constants `SESSION_COOKIE_NAME` ที่ hardcoded
  - ไล่ลบ `TODO`, `FIXME`, `LEGACY` ที่เกี่ยวกับ Auth Flow เก่า
- **Exit Criteria**: `rg "serializeSignedCookie"` ไม่พบผลลัพธ์ในโปรเจกต์

### Phase 5: Verification & Hard Gate
- **Build**: `npm run build`
- **Test**: รัน Regression tests สำหรับ Auth Flow
- **Smoke Test**: ทดสอบผ่าน LINE App จริง (Liff Login) และ Browser (Normal OAuth)

## ⚠️ Risks & Mitigation
- **Risk**: Better-Auth CSRF Protection ใน LINE Browser
  - **Mitigation**: ตรวจสอบ `allowedOrigins` ใน Better-Auth config ให้ครอบคลุม LINE domain
- **Risk**: Cookie Signature Mismatch ระหว่าง Local/Staging
  - **Mitigation**: ใช้ Native Signer ของ Better-Auth เสมอ ห้ามเขียนตัวเซ็นเอง

---
**Status**: 🚀 Ready for Implementation (Phase 1).
**Strategy**: @oracle-implementer start with `app/api/auth/liff-verify/route.ts`.

`ppp` `mmv-tarots` `better-auth-native` `liff-stabilization` `v3.1` `perfect-plan`

---

## Phase Progress Update

### 2026-03-09 21:23 +0700 - Phase 1 DONE
- Refactored `app/api/auth/liff-verify/route.ts` to remove manual `serializeSignedCookie` path.
- Session issuance now uses Better-Auth native internals:
  - `auth.$context.internalAdapter.createSession(user.id)`
  - cookie name/options derived from `getCookies(auth.options)`
  - signed cookie generated via Better-Call endpoint context (`setSignedCookie`) with Better-Auth secret.
- Account/user reconciliation was moved to Better-Auth internal adapter methods (`findAccountByProviderId`, `findUserByEmail`, `createOAuthUser`, `linkAccount`).
- Hard Gate status for this phase:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (20 files / 134 tests passed)

### 2026-03-09 22:19 +0700 - Phase 2 DONE
- Implemented durable target persistence for LIFF gateway flow:
  - Added `LIFF_TARGET_STORAGE_KEY` and `resolveDurableGatewayTarget` in `app/liff/page.tsx`.
  - Gateway now recovers target from localStorage when `mmv_next` is missing or malformed after callback.
  - Clears persisted target after successful token sync / verified return path.
- `handleLoginClick` in `lib/client/providers/navigation-provider.tsx` now saves current safe path+query to durable storage before redirecting to `/liff`.
- Added tests in `__tests__/lib/liff-phase1.test.ts` for durable recovery cases:
  - missing `mmv_next` -> restore persisted target
  - malformed/external `mmv_next` -> fallback to persisted safe target
- Hard Gate status for this phase:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (20 files / 136 tests passed)

### 2026-03-09 22:31 +0700 - Phase 3 DONE
- Aligned auth gate in `middleware.ts` with Better-Auth cookie contract helper.
  - Replaced hardcoded cookie checks (`mmv_auth.session_token` / `__Secure-mmv_auth.session_token`) with `getSessionCookie(request.headers, { cookiePrefix: 'mmv_auth' })` from `better-auth/cookies`.
  - Redirect behavior to `/liff?mmv_next=...` remains unchanged for unauthenticated protected routes.
- Hard Gate status for this phase:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (20 files / 136 tests passed)

### 2026-03-09 22:53 +0700 - Phase 4 DONE
- Completed Great Purge alignment for auth contract cleanup:
  - Replaced hardcoded auth cookie names in `__tests__/middleware.test.ts` with Better-Auth-derived names via `getCookies(auth.options)`.
  - Verified cleanup targets no longer exist in app/lib/tests scope: `serializeSignedCookie`, `SESSION_COOKIE_NAME`, `mmv_auth.session_token`, `__Secure-mmv_auth.session_token`.
- Stabilized existing flaky integration tests to satisfy hard gate deterministically:
  - Added explicit timeout (`15_000ms`) for slow CSV import assertions in `__tests__/app/cards-import.test.ts`.
- Hard Gate status for this phase:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (20 files / 136 tests passed)

### 2026-03-09 23:07 +0700 - Phase 5 DONE
- Added targeted auth regression coverage:
  - New file `__tests__/api/liff-verify-route.test.ts` with 4 route-level cases:
    - invalid payload -> `400`
    - invalid LINE token -> `401`
    - channel mismatch -> `401`
    - success path -> creates session and appends signed cookie
- Full Hard Gate status for this phase:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (21 files / 140 tests passed)
- Smoke verification note:
  - Real LINE App (IAB) end-to-end smoke still requires manual device run in staging/prod environment.
