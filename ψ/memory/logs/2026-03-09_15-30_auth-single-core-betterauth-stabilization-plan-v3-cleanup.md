# Snapshot: MMV Auth Single-Core Stabilization (Better Auth as Session Engine) - v3 Cleanup Hardened

**Time**: 2026-03-09 15:30 +0700
**Context**: อัปเดต /ppp หลัง grounding เพิ่ม explicit cleanup phase สำหรับ dead code และ legacy auth paths

## Objective
- ทำให้ login flow เสถียรและ deterministic ทั้ง LINE app และ browser โดยมีเส้นทางสร้าง session ทางเดียวผ่าน Better Auth contract
- กำจัด race condition, cookie mismatch, redirect target loss, และ dead code ที่ตกค้างจาก flow เดิม

## Scope
- In Scope:
  - `app/liff/page.tsx`
  - `app/api/auth/liff-verify/route.ts`
  - `lib/client/providers/navigation-provider.tsx`
  - `middleware.ts`
  - `__tests__/middleware.test.ts` และ auth-flow tests ที่เกี่ยวข้อง
- Out of Scope:
  - ถอด Better Auth ออกจากระบบทั้งหมด
  - เปลี่ยน business logic ของ payment/stars/referral
  - UI redesign ที่ไม่เกี่ยวกับ login/session

## Architecture Decision
- Keep: Better Auth เป็น single session engine
- Restrict: LIFF ทำหน้าที่ identity bridge เฉพาะ `/liff`
- Replace: ยกเลิก custom signed-cookie serialization ใน `liff-verify`
- Align: middleware/auth checks ต้องอ้างอิง Better Auth contract เดียวกัน
- Cleanup-first mindset: หลัง stabilize ต้องลบ legacy paths ให้หมดก่อนปิดงาน

## Grounded Cleanup Targets (Evidence-based)
- `app/api/auth/liff-verify/route.ts`
  - พบ `serializeSignedCookie`, `SESSION_COOKIE_NAME`, และ dual-cookie manual append
- `middleware.ts`
  - พบ hardcoded checks ของ `mmv_auth.session_token` และ `__Secure-mmv_auth.session_token`
- `app/liff/page.tsx`
  - พบ `tokenSyncKey` path ที่ต้องทบทวน lifecycle หลัง session flow ใหม่
- `lib/client/providers/navigation-provider.tsx`
  - พบ `isLoggingIn` state path ที่เสี่ยงค้าง หากไม่ reset ตาม lifecycle

## Phases
### Phase 1: Session Issuance Unification
- Deliverables:
  - Refactor `app/api/auth/liff-verify/route.ts` ให้สร้าง session/cookie ผ่าน Better Auth official API เท่านั้น
  - เอา logic `serializeSignedCookie` ออก
  - แยก response error code ให้ชัดเจน (invalid token, channel mismatch, session fail)
- Exit Criteria:
  - verify สำเร็จแล้ว `useSession()` เห็น user ได้ deterministic
  - refresh แล้วไม่หลุด session แบบสุ่ม
- Critical Test Cases:
  - valid LINE token -> 200 และ `/api/auth/session` เห็น session
  - invalid token -> 401 และไม่ set session cookie
  - channel mismatch -> 401 และไม่มี side effect

### Phase 2: Redirect State Hardening
- Deliverables:
  - ปรับ `app/liff/page.tsx` ให้เก็บ/กู้ `mmv_next` ผ่าน durable strategy
  - Harden target resolver ให้รับ path+query และ reject external URL
  - fallback `/` เฉพาะกรณี state ไม่ถูกต้องจริง
- Exit Criteria:
  - login จากหน้าป้องกันกลับหน้าเดิมได้
  - ไม่มี fallback `/` แบบไม่ตั้งใจ
- Critical Test Cases:
  - target with query survives OAuth callback
  - malformed state -> fallback `/`
  - external state -> reject + fallback `/`

### Phase 3: Client Flow Stabilization
- Deliverables:
  - แก้ `isLoggingIn` reset ให้ deterministic
  - ทำ `handleLoginClick()` idempotent กัน double push
  - ปรับ token sync lifecycle ไม่ให้ค้างข้าม session
- Exit Criteria:
  - spinner ไม่ค้างหลัง redirect กลับ
  - ไม่เกิด login loop ตอน session pending
- Critical Test Cases:
  - double click login -> navigate ครั้งเดียว
  - redirect+refresh -> spinner หยุด
  - revisit `/liff` -> ไม่เกิด verify storm

### Phase 4: Middleware Contract Alignment
- Deliverables:
  - ปรับ `middleware.ts` ให้ใช้ session contract เดียวกับ Better Auth
  - คง behavior `mmv_ref` โดยไม่ชน auth redirect
  - เพิ่ม coverage route matrix
- Exit Criteria:
  - unauthenticated protected -> redirect `/liff` พร้อม next
  - authenticated protected -> pass-through
- Critical Test Cases:
  - protected redirect matrix
  - authenticated pass-through
  - referral + auth redirect coexist

### Phase 5: Dead Code & Legacy Path Cleanup (NEW, Explicit)
- Deliverables:
  - ลบ code paths ที่ไม่ใช้แล้วหลัง migration phase 1-4
  - ลบ/ย้าย constants ชั่วคราวที่หมดบทบาท
  - ลบ helper/import ที่ไม่ถูกเรียก (auth and LIFF flow)
  - อัปเดต tests ให้สะท้อนเฉพาะ canonical flow ใหม่
- Exit Criteria:
  - ไม่พบการอ้างอิง `serializeSignedCookie` ใน codebase
  - ไม่มี hardcoded legacy cookie branches ที่ซ้ำ contract
  - ไม่มี unused auth symbols/imports ในไฟล์ scope
- Critical Cleanup Checks:
  - `rg -n "serializeSignedCookie|SESSION_COOKIE_NAME" app/api/auth/liff-verify/route.ts` -> no match
  - `rg -n "mmv_auth\.session_token|__Secure-mmv_auth\.session_token" middleware.ts` -> เหลือเฉพาะที่ align กับ contract ใหม่
  - `rg -n "TODO|LEGACY|TEMP" app/liff/page.tsx lib/client/providers/navigation-provider.tsx` -> no stale migration markers

### Phase 6: Hard Gate, Observability, Rollout
- Deliverables:
  - อัปเดต/เพิ่ม tests สำหรับ auth flow + middleware
  - structured logs รอบ `liff-verify` (status only, no secret)
  - rollout checklist + rollback checklist
- Exit Criteria:
  - Hard Gate ผ่านทั้งหมด
  - manual smoke ผ่าน Browser และ LINE app
- Critical Test Cases:
  - browser login end-to-end
  - LINE app login end-to-end
  - logout -> re-login stable

## Risks and Countermeasures
- Risk: Better Auth API contract mismatch
  - Countermeasure: ใช้ official server methods และเพิ่ม contract tests
- Risk: OAuth state edge cases
  - Countermeasure: state validation matrix + explicit safe fallback
- Risk: cleanup ลบของที่ยังใช้งาน
  - Countermeasure: cleanup ต้องทำหลัง phase 1-4 และผ่าน targeted grep checks ก่อน hard gate

## Rollback Strategy
- Trigger:
  - login failure เพิ่ม, session หายหลัง refresh, หรือ smoke test fail
- Steps:
  - revert ตาม phase boundary (Phase 6 -> 1)
  - rollback cleanup commit แยกจาก functional commits เสมอ
  - บันทึก revert evidence ใน `ψ/memory/logs/mmv-tarots/`

## Verification Strategy (Hard Gate)
- Build:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && bun run test`
- Targeted Cleanup Guard:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && rg -n "serializeSignedCookie|SESSION_COOKIE_NAME|LEGACY|TEMP" app lib middleware.ts`
- Manual Smoke:
  - Browser: home -> login -> restore target -> refresh
  - LINE app: open LIFF -> login -> protected route access

## Handoff to ggg
- Execution Order: Phase 1 -> 2 -> 3 -> 4 -> 5 -> 6
- Commit boundary:
  - Functional phases (1-4)
  - Cleanup phase (5) as separate commit
  - Hard-gate finalization (6)
- Snapshot หลังจบแต่ละ phase ลง `ψ/memory/logs/mmv-tarots/`

## Tags
`ppp` `mmv-tarots` `auth` `liff` `better-auth` `single-auth-core` `cleanup` `dead-code` `hard-gate`
