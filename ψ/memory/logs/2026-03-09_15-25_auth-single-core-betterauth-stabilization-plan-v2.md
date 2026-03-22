# Snapshot: MMV Auth Single-Core Stabilization (Better Auth as Session Engine)

**Time**: 2026-03-09 15:25 +0700
**Context**: แผน /ppp ฉบับสมบูรณ์เพื่อปิด auth loop แบบ robust โดยคง Better Auth เป็นแกน session เดียว

## Objective
- ทำให้ login flow เสถียรและ deterministic ทั้ง LINE app และ browser โดยมีเส้นทางสร้าง session ทางเดียวผ่าน Better Auth contract
- กำจัด race condition, cookie mismatch, และ redirect target loss โดยไม่เพิ่ม auth layer ใหม่

## Scope
- In Scope:
  - `app/liff/page.tsx`
  - `app/api/auth/liff-verify/route.ts`
  - `lib/client/providers/navigation-provider.tsx`
  - `middleware.ts`
  - Auth tests ที่เกี่ยวข้อง (`__tests__/middleware.test.ts` และ auth-flow tests)
- Out of Scope:
  - ถอด Better Auth ออกจากระบบทั้งหมด
  - เปลี่ยน business logic ของ payment/stars/referral
  - UI redesign ที่ไม่เกี่ยวกับ login/session

## Architecture Decision
- Keep: Better Auth เป็น single session engine
- Restrict: LIFF ใช้เฉพาะ identity bridge ที่ `/liff`
- Replace: ยกเลิกการ serialize cookie เองใน `liff-verify`; ใช้ Better Auth official session issuance path
- Persist: redirect target ต้องอยู่ในกลไกที่ survive OAuth round-trip และกัน open redirect

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
  - valid LINE token -> `POST /api/auth/liff-verify` ได้ 200 และ `/api/auth/session` เห็น session
  - invalid token -> 401 และไม่ set session cookie
  - channel mismatch -> 401 และไม่มี side effect ใน session table

### Phase 2: Redirect State Hardening
- Deliverables:
  - ปรับ `app/liff/page.tsx` ให้เก็บ/กู้ `mmv_next` ผ่าน durable state strategy (state key + safe fallback)
  - Harden `buildGatewayTarget()` ให้รองรับ path+query และ reject external URL
  - ทำ fallback path deterministic เป็น `/` เฉพาะกรณี state ไม่ถูกต้องจริง
- Exit Criteria:
  - login จาก `/profile`, `/history?tab=all`, `/submitted?id=...` กลับหน้าเดิมได้
  - ไม่หล่นกลับ `/` โดยไม่ตั้งใจ
- Critical Test Cases:
  - target with query survives OAuth callback
  - malformed state -> fallback `/`
  - external state URL -> reject และ fallback `/`

### Phase 3: Client Flow Stabilization
- Deliverables:
  - แก้ `lib/client/providers/navigation-provider.tsx` ให้ `isLoggingIn` reset เสมอหลัง flow จบ
  - ทำ `handleLoginClick()` เป็น idempotent กัน double click/push
  - ปรับ token sync key lifecycle ใน `/liff` ไม่ให้ค้างข้าม session
- Exit Criteria:
  - spinner login ไม่ค้างหลัง redirect กลับ
  - ไม่เกิด login loop เมื่อ `useSession` pending
- Critical Test Cases:
  - click login ซ้ำเร็วๆ -> navigate ครั้งเดียว
  - redirect กลับ + refresh -> spinner หยุด, state คงที่
  - เข้า `/liff` ซ้ำหลัง verify แล้ว -> ไม่ยิง verify storm

### Phase 4: Middleware Contract Alignment
- Deliverables:
  - ปรับ `middleware.ts` ให้ผูกกับ session contract ที่สอดคล้อง Better Auth (เลี่ยง hardcoded drift)
  - คง behavior `mmv_ref` โดยไม่ทับ auth redirect
  - เพิ่ม coverage เส้นทาง protected route matrix
- Exit Criteria:
  - unauthenticated ไป protected -> redirect `/liff` พร้อม next path
  - authenticated ไป protected -> pass-through
- Critical Test Cases:
  - protected routes redirect matrix
  - authenticated pass-through matrix
  - referral + auth redirect ทำงานร่วมกัน

### Phase 5: Hard Gate, Observability, Rollout
- Deliverables:
  - อัปเดต unit/integration tests สำหรับ auth flow
  - ใส่ structured logs ใน `liff-verify` (status only, no secret)
  - ทำ rollout checklist + rollback checklist
- Exit Criteria:
  - Hard Gate ผ่าน: build/lint/test
  - Manual smoke ผ่านทั้ง Browser และ LINE app
- Critical Test Cases:
  - browser login end-to-end
  - LINE app login end-to-end
  - logout -> re-login ยังเสถียร

## Risks and Rollback
- Risk: ใช้ Better Auth API ผิด contract
  - Countermeasure: ยึด server-side official method เท่านั้นและเพิ่ม contract tests
- Risk: state handling edge cases เพิ่ม
  - Countermeasure: state validation matrix + explicit fallback rules
- Risk: regression ใน middleware
  - Countermeasure: route matrix tests ก่อน merge

### Rollback Strategy
- Trigger:
  - login failure rate สูงขึ้น, session หายหลัง refresh, หรือ smoke test fail
- Steps:
  - revert เป็น phase boundary (Phase 4 -> 1)
  - คืน fallback behavior ชั่วคราวเฉพาะส่วนที่กระทบ production
  - บันทึก root cause + revert evidence ใน `ψ/memory/logs/mmv-tarots/`

## Verification Strategy (Hard Gate)
- Build:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
- Lint:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
- Test:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && bun run test`
- Manual Smoke:
  - Browser: home -> login -> restore target -> refresh
  - LINE app: open LIFF -> login -> protected route access

## Handoff to ggg
- Execution Order: Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5
- Commit style ต่อเฟส: `type(scope): summary [auth-single-core]`
- Snapshot หลังจบแต่ละเฟสลง `ψ/memory/logs/mmv-tarots/`

## Tags
`ppp` `mmv-tarots` `auth` `liff` `better-auth` `single-auth-core` `stabilization` `hard-gate`
