# Mission Blueprint: LIFF Login Fix (#MMV-PHASE-5-7)
**Date**: 2026-03-08 23:47 (+07)
**Project**: mmv-tarots
**Issue**: LIFF Login Broken (Browser Login Deadlock + `/liff/profile` 404)
**Baseline**: `staging` branch (commit `6b8a9c8`)

---

## 🎯 Objective
แก้ไขระบบ LIFF Authentication ให้ผู้ใช้สามารถ Login ผ่าน LINE บน Browser ปกติและ LINE App ได้อย่างถูกต้อง โดยไม่เกิดปัญหา 404 หลัง Login

## 🦠 Root Cause Analysis

### Bug A: LIFF SDK Reserved Param Collision
- **File**: `middleware.ts` + `navigation-provider.tsx`
- **Problem**: ใช้ `liff.state` เป็นชื่อ Query Param สำหรับเก็บ Redirect Target
- **Why broken**: `liff.state` คือ **Reserved Parameter** ของ LINE LIFF SDK
  - เมื่อ `liff.init()` เห็น `?liff.state=%2Fprofile` ใน URL ปัจจุบัน → มันตีความว่า "นี่คือ request จาก LIFF Platform"
  - SDK จะ reconstruct URL เป็น `{endpoint_url}/profile` = `/liff/profile`
  - ไม่มี Route `/liff/profile` → **404**
- **Fix**: เปลี่ยนชื่อ param เป็น `mmv_next` (custom namespace, ไม่ conflict กับ SDK)

### Bug B: Browser Login Deadlock
- **File**: `app/liff/page.tsx` (line ~67)
- **Problem**: เงื่อนไข `liff.isInClient() && !liff.isLoggedIn()` ก่อนเรียก `liff.login()`
- **Why broken**: `liff.isInClient()` คืน `false` เมื่อเปิดใน Browser ปกติ (ไม่ใช่ใน LINE App)
  - เงื่อนไขไม่ผ่าน → ข้ามไป `liff.getAccessToken()` → ได้ `null` (ยังไม่ล็อกอิน)
  - `router.replace(target)` → วนกลับหน้าเดิมโดยไม่มีการ Login เลย
- **Fix**: ลบ `liff.isInClient() &&` guard ออก → เรียก `liff.login()` ทุกกรณีที่ `!liff.isLoggedIn()`

---

## 🗂️ Scope (Files to Change)

| File | Change |
|------|--------|
| `middleware.ts` | `liff.state` → `mmv_next` |
| `lib/client/providers/navigation-provider.tsx` | `buildLiffGatewayPath()`: `liff.state` → `mmv_next` |
| `app/liff/page.tsx` | `searchParams.get('liff.state')` → `mmv_next` + remove `isInClient()` gate |
| `__tests__/middleware.test.ts` | อัปเดต expectation จาก `liff.state=` → `mmv_next=` |
| `__tests__/lib/liff-phase1.test.ts` | อัปเดต expectation จาก `?liff.state=` → `?mmv_next=` |

---

## 🏃 Execution Phases

### Phase 1: Rename Reserved Param `liff.state` → `mmv_next`
**Goal**: ป้องกัน LIFF SDK intercepting redirect param

**Step 1.1** — `middleware.ts`:
```ts
// Before
liffUrl.searchParams.set('liff.state', pathname + (request.nextUrl.search || ''));
// After
liffUrl.searchParams.set('mmv_next', pathname + (request.nextUrl.search || ''));
```

**Step 1.2** — `navigation-provider.tsx` (buildLiffGatewayPath):
```ts
// Before
params.set('liff.state', state);
// After
params.set('mmv_next', state);
```

**Step 1.3** — `app/liff/page.tsx` (buildGatewayTarget + LiffGatewayClient):
```ts
// Before
export function buildGatewayTarget(rawState: string | null, referralCode: string | null)
// → Inside: searchParams.get('liff.state')
// After: no rename needed for function — caller must pass searchParams.get('mmv_next')
```
ในฟังก์ชัน `LiffGatewayClient`:
```ts
// Before
const target = buildGatewayTarget(searchParams.get('liff.state'), searchParams.get('ref'));
// After
const target = buildGatewayTarget(searchParams.get('mmv_next'), searchParams.get('ref'));
```

**Critical Test Cases**:
- `buildLiffGatewayPath('/profile', '')` → `/liff?mmv_next=%2Fprofile`
- Middleware `/profile` unauthenticated → redirect location มี `mmv_next=%2Fprofile`
- `/liff?mmv_next=%2Fprofile` → middleware ไม่ redirect ซ้ำ

### Phase 2: Fix Browser Login Deadlock
**Goal**: ให้ LIFF Login ทำงานได้ทั้งบน Browser ปกติและใน LINE App

**Step 2.1** — `app/liff/page.tsx`:
```ts
// Before
if (liff.isInClient() && !liff.isLoggedIn()) {
  liff.login({ redirectUri: window.location.href });
  return;
}
// After
if (!liff.isLoggedIn()) {
  liff.login({ redirectUri: window.location.href });
  return;
}
```

**Critical Test Cases**:
- Unit test: `isInClient() = false, isLoggedIn() = false` → `liff.login()` ถูกเรียก (not skipped)
- Manual: กด Login บน Browser → ถูก Redirect ไป LINE Login Page ไม่วนกลับ

### Phase 3: Update Test Suite (Hard Gate)
**Goal**: อัปเดต Test ทุกไฟล์ที่ใช้ `liff.state` ให้ใช้ `mmv_next`

**Step 3.1** — `__tests__/middleware.test.ts`:
```ts
// Before
expect(location).toContain('liff.state=%2Fprofile');
// After
expect(location).toContain('mmv_next=%2Fprofile');
```

**Step 3.2** — `__tests__/lib/liff-phase1.test.ts`:
```ts
// Before
expect(nextPath).toBe('/liff?liff.state=%2Fhistory...');
// After
expect(nextPath).toBe('/liff?mmv_next=%2Fhistory...');
```

**Critical Test Cases**:
- All 134 tests pass (regression free)

---

## ⚠️ Risks & Rollback

| Risk | Mitigation |
|------|-----------|
| LINE App LIFF Flow ใช้ `liff.state` จาก platform จริงๆ | LIFF Platform ของ LINE ตั้ง `liff.state` เองใน URL ที่มาจาก `liff.line.me/{id}` — แยกคนละ flow กับ `mmv_next` ที่เราตั้งใน App |
| Browser ไม่มี `liff.login()` URL หากไม่อยู่ใน LIFF App | `liff.init()` + `liff.login()` ทำงานนอก LINE App ได้ — จะ redirect ไป LINE OAuth page บน Browser |
| Rollback | `git checkout <commit-before>` บน `staging` |

---

## ✅ Verification Strategy (Hard Gate)

```bash
cd /Users/non/dev/opilot/projects/mmv-tarots
npm run test       # 134/134 pass (ห้ามตำกว่า)
npm run build      # ✅ No errors
npm run lint       # ✅ No lint errors
```

**Manual verification** (หลัง deploy):
1. เปิด `https://maemormimi.com` บน Desktop Browser → กด Login → ควรถูก redirect ไป LINE Login
2. กด `/profile` โดยไม่ login → ไปที่ `/liff` → ไป LINE Login → กลับมา `/profile` ได้
3. ไม่มี 404 ที่ `/liff/profile` อีกต่อไป
