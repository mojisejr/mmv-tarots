# Snapshot: MMV Auth Single-Core Stabilization (Better Auth as Session Engine)

**Time**: 2026-03-09 15:24 +0700
**Context**: แผนปิด loop auth แบบ robust โดยไม่ถอด Better Auth ออกจากระบบทันที

## Objective
- ทำให้ login flow เสถียรและ deterministic ทั้ง LINE app และ browser โดยใช้เส้นทางออก session เพียงทางเดียวผ่าน Better Auth API
- กำจัด race condition, cookie format mismatch, และ redirect target loss โดยไม่เพิ่ม auth layer ใหม่

## Scope
- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `app/liff/page.tsx`, `app/api/auth/liff-verify/route.ts`, `lib/client/providers/navigation-provider.tsx`, `middleware.ts`
  - Session issuance/verification ผ่าน Better Auth แบบ o## Objective
- ทำให้ login flow เสถียรและ deterministic ทั้ง LINE app และ browser โดยใช้เส้นทางออก session เพียงทางเดียวผ่าน Better Auth API
- กำจัด race condition, cookie format mismatch, และ redirect target loss โดย?e- ทำใ? กำจัด race condition, cookie format mismatch, และ redirect target loss โดยไม่เพิ่ม auth layer ใหม่

## Scope
- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `a?## Scope
- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `aff-verify` แล้วใช้ Better Auth official session- In Scon  - Auth frsist: redirect target ต้องอยู่ในช่องทางที่ไม่หายระหว่าง OAuth (state/nonce-backed storage)

## Phase Plan
### Phase 1: S- ทำให้ login flow เสถียรและ deterministic ทั้?/- กำจัด race condition, cookie format mismatch, และ redirect target loss โดย?e- ทำใ? กำจัด race condition, cookie format mismatch, และ redirect target loss โดยไม่เพิ่?## Scope
- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `a?## Scope
- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `aff-verify` แล้วใช้ Better Auth official session- In Scon  - Auth frsis??? In Scser ได้? In Scope:
  - Auth flow ที่เกี่ยวข้องกับ ??  - Auth f??
## Phase Plan
### Phase 1: S- ทำให้ login flow เสถียรและ deterministic ทั้?/- กำจัด race condition, cookie format mismatch, และ redirect target loss โดย?e- ทำใ? กำจัด race condition, cookie format mismatch, และ redirease### Phase 1: S- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `a?## Scope
- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `aff-verify` แล้วใช้ Better Auth official session- In Scon  - Auth frsis??? In Scser ได้? In Scope:
  - Auth flow ที่เกี่ยวข้อง?c  - Auth f+ - In Scope:
  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  - Auth flow ที่เกี่ยวข้องกับ ??  - Auth f??
## Phase Plan
### Phase 1: S- ทำให้ login flow เสถียรและ deterministic ทั??# Phase Plan
### Phase 1: S- ทำให้ login flow เสถียรน### Phase 1:? - Auth flow ที่เกี่ยวข้องกับ `a?## Scope
- In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `aff-verify` แล้วใช้ Better Auth official session- In Scon  - Auth frsis??? In Scser ได้? In Scope:
  - Auth flow ที่เกี่ย?ห้ `isLoggingIn` reset ได้เสมอหลัง route settle/sess  - Auth f
   - Auth flow ที่เกี่ยวข้อง?c  - Auth f+ - In Scope:
  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  - Auth flow ที่๸?  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  ia## Phase Plan
### Phase 1: S- ทำให้ login flow เสถียรและ deterministic ทั??# Phase Plan
### Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow เสถียรน### Phase 1:? - Auth flow ที่เ? - In Scope:
  - Auth flow ที่เกี่ยวข้องกับ `aff-verify` แล้วใช้ Better Auth official session- In Scon  - Auew  - Auth fct  - Auth flow ที่เกี่ย?ห้ `isLoggingIn` reset ได้เสมอหลัง route settle/sess  - Auth f
   - Auth flow ที่เกี่ยวข้อง?  - Auth flow ที่เกี่ยวข้อง?c  - Auth f+ - In Scope:
  - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phase 1: S- ทำให้ login flow เสถียรและ deterministic ทั??# Phase Plan
### Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow?## Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow เสถี?d  - Auth flow ที่เกี่ยวข้องกับ `aff-verify` แล้วใช้ Better Auth official session- In Scon  - Auew  - Auth fct  - Auth liv   - Auth flow ที่เกี่ยวข้อง?  - Auth flow ที่เกี่ยวข้อง?c  - Auth f+ - In Scope:
  - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phase 1: S-s
  - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phaua### Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow?## Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow เสถี?d  - Auth flow ที่เกี่Au  - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phase 1: S-s
  - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phaua### Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow?## Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow เสถี?d  - Auth flow ทจ? - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phaua### Ph f  - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phaua### Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow?## Phase 1: S- ทำให้ wo### Phase 1:?## Phase 1: S- ทำให้ login flow เสถี?d  - Auth flow ทจ? - Auth flow ที่เกี่ยวข??  - Auth flow ที่เกี่ยวข้องกับ ed  - Auth f??  -Ex### Phaua### Ph f  - Auth flow cts/mmv-tarots && bun run test`
- Manual Smoke:
  - Browser: home -> login -> target restore -> refresh
  - LINE app: open LIFF -> login/session -> protected route access

## Handoff to ggg
- Suggested execution order: Phase 1 -> 2 -> 3 -> 4 -> 5
- Commit checkpoint per phase with message suffix `[auth-single-core]`
- Snapshot after each phase to `ψ/memory/logs/mmv-tarots/`

## Tags
`ppp` `mmv-tarots` `auth` `liff` `better-auth` `single-auth-core` `stabilization` `hard-gate`

