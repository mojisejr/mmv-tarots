# Snapshot: MMV Auth Identity Boundary Refactor

**Time**: 2026-03-11 10:43 +0700
**Context**: Deep grounding plan for simple + robust multi-entry auth, LIFF/browser/provider future, plus cleanup

## Objective
- Refactor MMV auth architecture ให้รองรับ 3 เส้นทางพร้อมกันแบบไม่ชนกัน: LIFF entry จาก LINE OA, browser login, และ provider อื่นในอนาคต โดยยังคง Better-Auth เป็น auth core แต่ลดการ coupling กับ LIFF และ Messaging concerns
- ปิด bug class เดิมซ้ำๆ ได้แก่ session sync gap, loading deadlock, redirect drift, และ provider-specific logic รั่วเข้า navigation shell
- เก็บกวาดขยะเชิงสถาปัตยกรรมระหว่างทาง เพื่อไม่ให้มี dual-path auth หรือ naming/flow ที่ทำให้คนอ่านโค้ดสับสนในรอบถัดไป

## Scope
- In Scope:
  - แยก boundary ระหว่าง Auth Core, LINE Identity/LIFF Gateway, Messaging/Account Linking, Referral Attribution, และ Client Session Shell
  - Refactor current LIFF success path ให้ deterministic ใน browser/LINE app
  - ปรับ client session shell ให้ไม่ deadlock เมื่อ balance fetch fail หรือ session revalidation ช้า
  - เตรียม schema/domain model สำหรับ future multi-provider โดยไม่ทุบ business tables
  - Cleanup dead code, obsolete comments, legacy naming, and overlapping auth paths
- Out of Scope:
  - เพิ่ม Google provider จริงในรอบนี้
  - สร้าง Messaging API campaign system เต็มรูปแบบ
  - Redesign payment/onboarding UX ที่ไม่เกี่ยวกับ auth boundary
  - Production data migration ที่มีผลทำลายข้อมูลเดิมโดยไม่จำเป็น

## Architecture Direction
- Keep: Better-Auth เป็น session/core provider framework
- Split Out:
  - LIFF Gateway = LINE-specific entry adapter เท่านั้น
  - LINE Identity = persistence/mapping layer ของ LINE account -> app user
  - Messaging/Account Linking = capability layer แยกจาก login flow
  - Navigation/Auth Shell = session hydration + balance hydration ที่แยก concern กัน
- Rule:
  - ห้ามให้ NavigationProvider แบก provider-specific logic
  - ห้ามให้ referral logic อยู่ใน auth core hook แบบ implicit ถ้ายังไม่มี explicit boundary
  - ห้ามมี dual auth path ที่ทั้ง Better-Auth route และ custom LIFF bridge ทำสิ่งเดียวกันซ้ำกันโดยไม่มีเจ้าของที่ชัด

## Phases
### Phase 1: Freeze The Boundary
- Deliverables:
  - สรุป auth ownership matrix ต่อไฟล์หลัก: `lib/server/auth.ts`, `app/api/auth/liff-verify/route.ts`, `app/api/auth/[...all]/route.ts`, `app/liff/page.tsx`, `middleware.ts`, `lib/client/providers/navigation-provider.tsx`
  - นิยาม 4 modules ชัดเจน: `auth-core`, `line-identity`, `line-gateway`, `session-shell`
  - ตัดสินใจ naming ใหม่สำหรับ LINE linkage model/abstractions โดยไม่ผูกกับ Better-Auth internals
- Cleanup:
  - mark และลบ comments ที่อิง phase เก่าซึ่งทำให้ flow ปัจจุบันอ่านยาก
  - ลดคำว่า native/unification/phase tags ใน runtime code เหลือ domain naming จริง
- Exit Criteria:
  - ทุก auth-related file มี owner ชัดว่าอยู่ชั้นไหน
  - ไม่มี ambiguity ว่า route ไหนรับผิดชอบ session creation และ route ไหนแค่ LINE verification
- Critical Test Cases:
  - review pass: สามารถอธิบาย login flow 1 ครั้งจบได้โดยไม่ย้อนข้ามไฟล์เกินจำเป็น
  - grep pass: ไม่มี provider-specific logic โผล่ใน navigation shell เกินจำเป็น

### Phase 2: Stabilize Session Shell
- Deliverables:
  - แยก `session pending` ออกจาก `balance hydration` ใน `NavigationProvider`
  - เปลี่ยน LIFF success redirect ให้เป็น hard navigation ในจุดที่ต้อง force cookie re-read
  - เพิ่ม fallback state เช่น `balanceResolved` หรือ equivalent เพื่อกัน infinite overlay
- Cleanup:
  - ลบ state/flags ที่ซ้ำซ้อนหรือ misleading เช่น loading flags ที่ไม่ใช้งานจริง
  - ย้าย helper function ที่เกี่ยวกับ gateway target ไปไว้ตำแหน่งที่มี owner ชัด
- Exit Criteria:
  - login success แล้ว app interactive ได้แม้ balance fetch fail
  - refresh ไม่ใช่ทางแก้หลักอีกต่อไป
- Critical Test Cases:
  - LIFF login success -> redirect target -> home/profile usable without manual refresh
  - `/api/credits/balance` fail/timeout -> overlay ไม่ค้างถาวร
  - logout -> session cleared -> protected route redirect works deterministically

### Phase 3: Normalize LINE Identity Layer
- Deliverables:
  - Refactor LIFF verify route ให้เหลือหน้าที่ชัด: verify LINE token, resolve/link app user, request auth-core session issuance
  - เตรียม domain-facing abstraction สำหรับ LINE identity mapping แทนการใช้ Better-Auth internal adapter กระจายตรงๆ
  - กำหนดชัดว่า `Account`/`Session`/`Verification` จะใช้ต่อ, wrap, หรือ prepare migration อย่างไร
- Cleanup:
  - ลด direct calls ต่อ Better-Auth internals ใน route ให้อยู่หลัง service boundary
  - ลบ fallback naming ที่ผูกกับ temporary workaround เช่น implicit fake email assumptions ถ้ามี abstraction ที่ดีกว่า
- Exit Criteria:
  - LIFF verify route อ่านแล้วเห็น 3 ขั้น: verify -> resolve identity -> issue session
  - schema decision ชัดว่าอะไรคือ auth-core table และอะไรคือ LINE linkage concern
- Critical Test Cases:
  - existing LINE user -> login success -> same user record reused
  - first-time LINE user -> user/link/session created once only
  - conflicting line account link -> returns 409 deterministically

### Phase 4: Prepare Multi-Provider Future Safely
- Deliverables:
  - ออกแบบ user identity contract สำหรับ provider อื่นในอนาคต โดยไม่ผูก business logic กับ LINE-only assumptions
  - ระบุ path สำหรับ browser login และ future Google login ให้ share auth-core เดียวกัน
  - ออกแบบ integration point สำหรับ Messaging API account linking แยกจาก login success path
- Cleanup:
  - ย้าย LINE/OA messaging assumptions ออกจาก auth/login comments, docs, and runtime branches
  - ทำให้ referral attribution ไม่ขึ้นกับ LIFF-only entry path
- Exit Criteria:
  - สามารถเพิ่ม provider ใหม่โดยไม่แก้ navigation shell หรือ business tables หลัก
  - LINE OA messaging capability ถูกมองเป็น linked capability ไม่ใช่ auth requirement
- Critical Test Cases:
  - browser-only session path ยังใช้ protected routes เดิมได้
  - user without LINE link ยัง login ได้ แต่ feature ที่ต้อง push OA ถูก disable gracefully
  - linked LINE user retains same app account across future provider linking strategy

### Phase 5: Hard Cleanup + Verification Gate
- Deliverables:
  - ลบ legacy comments, unused flags, dead imports, obsolete helper names, and stale tests ที่ผูกกับ flow เก่า
  - อัปเดต `project_map.md` ให้สะท้อน architecture ใหม่หลัง refactor เสร็จ
  - สรุป cleanup ledger ว่าอะไรถูกลบ อะไร intentionally retained
- Cleanup:
  - remove old auth terminology that no longer reflects real runtime
  - remove test fixtures that validate obsolete cookie/session assumptions only
- Exit Criteria:
  - auth code path เหลือเส้นหลักเดียวต่อ concern
  - map/tests/runtime naming สอดคล้องกัน
- Critical Test Cases:
  - build/lint/test ผ่านทั้งหมด
  - manual smoke: LIFF app, mobile browser, desktop browser
  - grep smoke: ไม่เหลือ legacy auth helpers/workarounds ที่ประกาศเลิกใช้แล้ว

## Risks & Countermeasures
- Risk: แก้ shell แล้วไปกระทบ profile/package/history pages ที่พึ่ง `useSession()`
  - Countermeasure: ทำ shell stabilization ก่อน schema refactor และทดสอบ protected routes ทุกเฟส
- Risk: cleanup เร็วเกินไปจนลบเส้นทาง fallback ที่ยังจำเป็น
  - Countermeasure: cleanup เฉพาะหลังมี owner replacement ชัดเจนในเฟสเดียวกัน
- Risk: future provider plan ทำให้รอบนี้ scope บวม
  - Countermeasure: รอบนี้แค่เตรียม boundary และ contracts ไม่เพิ่ม Google runtime จริง
- Risk: referral + onboarding side effects ผูกกับ Better-Auth hook มากเกินไป
  - Countermeasure: inventory side effects ให้ครบก่อนย้ายออกหรือห่อ service boundary

## Rollback Strategy
- Trigger:
  - login success rate แย่ลง, protected routes เข้าไม่ได้, หรือ profile/package/history fail หลัง refactor
- Rollback Steps:
  - revert เป็น phase-by-phase commits เท่านั้น ไม่ rollback แบบรวมก้อน
  - preserve schema compatibility ระหว่าง refactor รอบนี้ เพื่อให้ rollback ได้โดยไม่ต้อง reset DB
  - keep business API contracts (`/api/credits/balance`, onboarding, referrals) unchanged unless explicitly versioned

## Verification Strategy
- Hard Gate per implementation phase:
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Test: `npm run test`
- Targeted manual verification:
  - LINE in-app LIFF login จาก deep link และ home entry
  - Browser login flow และ protected route recovery
  - Sign-out -> re-entry -> referral persistence still works
- Targeted code verification:
  - grep Better-Auth internals usage ต้องลดลงและถูกจำกัดไว้ใน owner layer
  - grep session/loading flags ต้องไม่มี dead branch ที่ไม่ถูกใช้งาน

## Suggested File Strategy
- Keep and refactor:
  - `lib/server/auth.ts`
  - `app/api/auth/liff-verify/route.ts`
  - `app/api/auth/[...all]/route.ts`
  - `app/liff/page.tsx`
  - `lib/client/providers/navigation-provider.tsx`
  - `middleware.ts`
- Likely introduce/refactor into services:
  - `lib/server/services/line-identity-service.ts`
  - `lib/server/services/session-shell-contract.ts` or equivalent helper
- Cleanup candidates:
  - stale phase comments in auth/navigation files
  - duplicate target resolution logic if split across gateway/navigation
  - obsolete test expectations tied to temporary cookie contract workarounds

## Success Criteria
- คุณนนท์สามารถอธิบายระบบ auth ใหม่ได้ใน 4 บรรทัด: browser/LIFF เข้าอย่างไร, session เกิดที่ไหน, LINE identity อยู่ตรงไหน, OA messaging ผูกเมื่อไร
- bug class เดิมเรื่อง redirect drift + loading deadlock + sync gap ไม่กลับมาใน manual smoke
- โค้ดเปิดทางให้ Google/future providers ได้โดยไม่ต้องรื้อ LIFF flow ใหม่อีกครั้ง

## Tags
`mmv-tarots` `auth-refactor` `better-auth` `liff` `identity-boundary` `cleanup` `plan`

---

## 2026-03-11 10:54 +0700 — Confidence Revision Addendum

### Confidence Level
- **Overall confidence in plan direction**: **8.2/10**
- **Confidence that current live bug class will be reduced materially in Phase 2**: **9/10**
- **Confidence that cascading errors will stay low if we follow the phase order strictly**: **7.6/10**
- **Confidence in zero-cascade / no-regression guarantee**: **not claimed**

### Why Confidence Is High Enough To Proceed
- Current blast radius is **bounded**, not system-wide:
  - `useSession()` / auth-client dependency is concentrated in roughly 5 user-facing areas: navigation shell, profile, package, welcome ritual, and share actions
  - Better-Auth internal adapter usage is concentrated primarily in `app/api/auth/liff-verify/route.ts`
  - Middleware coupling is shallow and contract-based (`getSessionCookie`) rather than spread across many files
- The current production symptom is aligned with a **specific two-layer failure model already evidenced in memory**:
  - session sync gap after LIFF success redirect
  - loading deadlock caused by coupling auth hydration with balance hydration
- We are **not changing business APIs first**; this sharply lowers cascade risk versus a schema-first or provider-first rewrite

### What Makes The Plan Safe Enough
- **Containment-first ordering**: shell stabilization before identity/schema movement
- **No-provider-expansion rule**: no Google/new provider runtime work in this plan
- **No-DB-break rule in early phases**: no destructive schema migration in Phase 1-2
- **Single-owner refactor rule**: every concern gets one owner layer before cleanup begins

### Revised Execution Order (Sharper)
1. **Phase 1A: Ownership Matrix Only**
   - pure grounding + file ownership + rename targets
   - no runtime behavior change except comment/structure cleanup
2. **Phase 2A: Session Shell Stabilization**
   - separate `sessionPending` from `balanceResolved`
   - ensure LIFF success path can force full re-hydration where needed
   - this is the highest-leverage bug fix step and should land before any identity abstraction move
3. **Phase 2B: Protected Route Smoke Sweep**
   - immediately verify `/profile`, `/package`, `/history`, `/submitted` after shell changes
4. **Phase 3: LINE Identity Service Extraction**
   - move `internalAdapter` orchestration behind service boundary
   - route becomes thin adapter
5. **Phase 4-5**
   - future-provider preparation and hard cleanup only after live auth shell proves stable

### Hard Constraints Added
- **No schema rename or table migration before Phase 3 proves green**
- **No referral-hook relocation before Phase 2 passes manual smoke**
- **No broad cleanup in auth files before replacement owner exists in code**
- **No attempt to optimize UX wording or payment/onboarding behavior during auth shell stabilization**

### Explicit Blast Radius Map
- **Low Risk**
  - `middleware.ts`
  - `app/api/auth/[...all]/route.ts`
  - comments / naming cleanup in map and docs
- **Medium Risk**
  - `app/liff/page.tsx`
  - `components/features/onboarding/WelcomeRitual.tsx`
  - `components/reading/share-actions.tsx`
- **High Risk**
  - `lib/client/providers/navigation-provider.tsx`
  - `app/profile/page.tsx`
  - `app/package/page.tsx`
  - `app/api/auth/liff-verify/route.ts`

### Cascading Error Prevention Strategy
- Keep business contracts stable:
  - `/api/credits/balance`
  - onboarding API
  - referral cookie contract
- Refactor only one high-risk owner at a time
- Run targeted manual smoke immediately after each high-risk file cluster changes, not only at end-of-plan
- Prefer additive wrapper/service extraction before deletion

### Abort / Replan Criteria
- Stop and replan immediately if any of these occur:
  - `useSession()` consumers outside the known 5-point blast radius are discovered to be auth-critical
  - shell stabilization requires changing more than navigation + LIFF gateway + 2 dependent pages at once
  - schema incompatibility is required before live bug is fixed
  - referral/onboarding side effects cannot be isolated without changing business behavior in same phase

### Definition Of Success For “Low Cascade”
- The live loading-hang bug is removed
- Protected routes still gate correctly
- Logout still clears access deterministically
- No business-table migration is required to achieve the above
- Subsequent phases become simplification work, not emergency debugging

### Final Confidence Statement
- I am confident this plan is **strong enough to start implementation** because it attacks the proven live bug with the smallest high-leverage move first and delays structural ambition until runtime stability is re-established.
- I am **not** confident that a looser version of this plan would be safe. The safety comes from the order: **boundary first, shell second, identity third, future-provider prep fourth, cleanup last**.

---

## 2026-03-11 11:04 +0700 — Phase 1 Execution Status (ggg)

### Status
- Phase 1 (`Freeze The Boundary`) is **DONE**.

### Completed Deliverables
- Added explicit ownership matrix and module boundaries in `docs/auth-ownership-matrix.md`.
- Defined and introduced `session-shell` contract file: `lib/client/auth/session-shell-contract.ts`.
- Removed cross-layer coupling where navigation shell imported LIFF gateway module directly.
- Clarified `liff-verify` flow into explicit 3-step boundary comments: `verify -> resolve identity -> issue session`.
- Cleaned legacy phase-tag comments in auth core where domain naming now exists.

### Notes
- This phase intentionally avoided schema/runtime behavior changes.
- Next target remains Phase 2A (`session pending` vs `balance hydration` decoupling).

---

## 2026-03-11 11:14 +0700 — Phase 2 Execution Status (ggg)

### Status
- Phase 2 implementation is **DONE** for code delivery (`session-shell stabilization`).

### Completed Deliverables
- Separated session auth pending from balance hydration readiness in `NavigationProvider`.
- Added explicit `balanceResolved` fallback state so initial overlay does not deadlock when `/api/credits/balance` fails.
- Removed misleading/unused balance loading flag path and simplified hydration logic.
- Updated LIFF gateway success path to use hard navigation (`window.location.assign`) after verified session issuance to force cookie re-read.

### Verification
- Hard Gate passed: `npm run build`, `npm run lint`, `npm run test`.

### Notes
- Manual smoke sweep for `/profile`, `/package`, `/history`, `/submitted` is still recommended immediately after deployment candidate startup.

---

## 2026-03-11 11:40 +0700 — Phase 3 Execution Status (ggg)

### Status
- Phase 3 (`Normalize LINE Identity Layer`) is **DONE** for code delivery.

### Completed Deliverables
- Extracted `line-identity` domain boundary to `lib/server/services/line-identity-service.ts`.
- Refactored LIFF verify flow to explicit 3-step orchestration in route: `verify -> resolve identity -> issue session`.
- Added `auth-session` wrapper in `lib/server/services/auth-session-service.ts` so route no longer manipulates Better-Auth internals directly.
- Updated ownership matrix to reflect service boundaries after extraction.
- Added service tests for existing/new/conflicting LINE identity scenarios.

### Verification Plan
- Hard Gate required next: `npm run build`, `npm run lint`, `npm run test`.
- Manual smoke still recommended after deployment candidate startup.

---

## 2026-03-11 12:29 +0700 — Phase 4 Execution Status (ggg)

### Status
- Phase 4 (`Prepare Multi-Provider Future Safely`) is **DONE** for code delivery.

### Completed Deliverables
- Introduced provider-agnostic identity contract in `lib/server/services/provider-identity-contract.ts`.
- Refactored `line-identity-service` to use provider contract fields (`providerId`, `providerAccountId`, `providerIdentityEmail`) while keeping runtime behavior stable.
- Updated ownership map to include `identity-contract` boundary and explicit capability rule: LINE OA messaging is linked capability, not auth requirement.
- Added contract tests in `__tests__/services/provider-identity-contract.test.ts` and updated LINE identity tests accordingly.

### Verification
- Hard Gate passed: `npm run test`, `npm run lint`, `npm run build`.

### Notes
- This phase intentionally avoided introducing Google runtime auth.
- Browser and LIFF paths continue to share the same auth-core/session issuance boundary.

---

## 2026-03-11 12:37 +0700 — Phase 5 Execution Status (ggg)

### Status
- Phase 5 (`Hard Cleanup + Verification Gate`) is **DONE** for code delivery.

### Completed Deliverables
- Cleaned auth-core implementation in `lib/server/auth.ts`:
  - removed dead import
  - simplified non-blocking referral hook flow
  - aligned LINE fallback email generation with provider identity contract
- Updated provider-agnostic route ownership comment in `app/api/auth/[...all]/route.ts`.
- Updated `project_map.md` to reflect Auth v3.2 boundaries and current risk landscape.

### Cleanup Ledger
- Removed:
  - dead import (`CreditService`) in auth core
  - obsolete LINE-only wording in catch-all auth route comments
- Intentionally Retained:
  - `legacySuccess` payment callback compatibility in `app/profile/page.tsx` (required for backward callback URLs)
  - existing test filenames with historical phase labels (`liff-phase1`, `referral-phase2`) to avoid churn without behavior gain

### Verification
- Hard Gate passed: `npm run test`, `npm run lint`, `npm run build`.

### Notes
- Manual smoke remains required after deploy candidate on LIFF + browser entry points.

