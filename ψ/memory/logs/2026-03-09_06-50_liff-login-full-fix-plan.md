# Mission Blueprint: LIFF Login Full Fix (#MMV-PHASE-5-8)
**Date**: 2026-03-09 06:50 (+07)
**Project**: mmv-tarots
**Branch**: staging
**Baseline Commit**: `6b8a9c8`
**Issue**: Login บน Browser เด้งกลับหน้าแรกทุกครั้ง (Login bounce loop)

---

## 🎯 Objective & Scope

แก้ไขระบบ LIFF Authentication ให้:
1. ผู้ใช้บน **Browser ปกติ** (Chrome, Safari) สามารถ Login ผ่าน LINE OAuth ได้สำเร็จ
2. ผู้ใช้ใน **LINE App** (LIFF Client) ยังคง Login ได้เหมือนเดิม
3. หลัง Login สำเร็จ → ถูก Redirect ไปยังหน้าที่ต้องการ (ไม่ใช่หน้าแรก)
4. ไม่มี Double Verify หรือ Race Condition จาก LiffProvider + LiffGatewayClient

**Scope (Files ที่ต้องแก้)**:
| File | เหตุผล |
|------|--------|
| `middleware.ts` | ยังใช้ `liff.state` (SDK Reserved Param) |
| `lib/client/providers/navigation-provider.tsx` | `buildLiffGatewayPath()` ยังใช้ `liff.state` |
| `app/liff/page.tsx` | อ่าน `liff.state` + มี `isInClient()` guard deadlock |
| `components/providers/liff-provider.tsx` | `isInClient()` guard + Double Init Race |
| `__tests__/middleware.test.ts` | ยังเช็ค `liff.state=` |
| `__tests__/lib/liff-phase1.test.ts` | ยังเช็ค `liff.state=` |

---

## 🩺 Root Cause Summary (จาก Inspection Checklist)

### Bug A — Reserved Param Collision (Root of "/liff/profile 404" + target = `/`)
**Mechanism**:
- `middleware.ts` set redirect → `/liff?liff.state=%2Fprofile`
- LINE LIFF SDK เห็น `liff.state` ใน URL เมื่อ `liff.init()` → **SDK intercepts** → reconstruct URL เป็น `{endpoint}/profile` = `/liff/profile` → 404
- ในขณะเดียวกัน `LiffGatewayClient` อ่าน `searchParams.get('liff.state')` ได้ `null` (SDK ลบออกแล้ว) → `target = '/'` → bounce กลับ home

**Fix**: เปลี่ยนทุกที่ที่ใช้ `liff.state` เป็น `mmv_next` (custom namespace, ไม่ conflict กับ SDK)

### Bug B — Browser Login Deadlock
**Mechanism**:
- Guard `if (liff.isInClient() && !liff.isLoggedIn())` → `liff.isInClient()` = false บน Browser
- เงื่อนไข false → ข้ามการ call `liff.login()` → ไปที่ `getAccessToken()` → null → `router.replace('/')` → bounce กลับ home

**Fix**: ลบ `liff.isInClient() &&` ออกจาก guard → เรียก `liff.login()` ทุกกรณีที่ `!liff.isLoggedIn()`

### Bug C — LiffProvider Double Init / Race Condition
**Mechanism**:
- `LiffProvider` (global, mount บนทุกหน้า) + `LiffGatewayClient` (/liff page) ต่างก็ call `liff.init()` พร้อมกัน
- ทั้งสองผ่าน sessionStorage dedup check พร้อมกัน (ก่อนฝ่ายใดฝ่ายหนึ่ง set token)
- `LiffGatewayClient` navigate → `LiffProvider` ทำ `window.location.reload()` ขัดจังหวะ

**Fix**: ใน `LiffProvider` ตรวจสอบ `pathname` ด้วย `usePathname()` → skip bootstrap ถ้าอยู่บน `/liff`

---

## 📋 Execution Phases

---

### Phase 1 — Rename `liff.state` → `mmv_next` (Reserved Param Fix)
**Objective**: ป้องกัน LIFF SDK intercepting redirect param ในทุกจุดที่ตั้งค่า/อ่านค่า

#### Step 1.1 — `middleware.ts`
**Location**: บรรทัด ~32
```ts
// BEFORE
liffUrl.searchParams.set('liff.state', pathname + (request.nextUrl.search || ''));

// AFTER
liffUrl.searchParams.set('mmv_next', pathname + (request.nextUrl.search || ''));
```

#### Step 1.2 — `lib/client/providers/navigation-provider.tsx` (buildLiffGatewayPath)
**Location**: ฟังก์ชัน `buildLiffGatewayPath()`
```ts
// BEFORE
params.set('liff.state', state);
return `/liff?${params.toString()}`;

// AFTER
params.set('mmv_next', state);
return `/liff?${params.toString()}`;
```

#### Step 1.3 — `app/liff/page.tsx` (LiffGatewayClient)
**Location**: ใน `useEffect` ของ `LiffGatewayClient`
```ts
// BEFORE
const target = buildGatewayTarget(searchParams.get('liff.state'), searchParams.get('ref'));

// AFTER
const target = buildGatewayTarget(searchParams.get('mmv_next'), searchParams.get('ref'));
```

**Critical Test Cases Phase 1**:
- [ ] `buildLiffGatewayPath('/profile', '')` → ผลลัพธ์ต้องมี `mmv_next=%2Fprofile`
- [ ] `buildLiffGatewayPath('/', '')` → ผลลัพธ์ต้องมี `mmv_next=%2F`
- [ ] Middleware redirect `/profile` (no session) → Location header มี `mmv_next=%2Fprofile` ไม่ใช่ `liff.state=`
- [ ] `/liff?mmv_next=%2Fprofile` → middleware ไม่ redirect ซ้ำ (ยังคง pass)

**Exit Criteria**: ไม่มี `liff.state` ใน query params ที่ app ตั้งเองอีกต่อไป

---

### Phase 2 — Fix `isInClient()` Guard (Browser Login Deadlock)
**Objective**: ให้ผู้ใช้บน Browser ปกติสามารถ trigger `liff.login()` ได้

#### Step 2.1 — `app/liff/page.tsx`
**Location**: ใน `runGateway()` ใน `LiffGatewayClient`
```ts
// BEFORE
if (liff.isInClient() && !liff.isLoggedIn()) {
  liff.login({ redirectUri: window.location.href });
  return;
}

// AFTER
if (!liff.isLoggedIn()) {
  liff.login({ redirectUri: window.location.href });
  return;
}
```

#### Step 2.2 — `components/providers/liff-provider.tsx`
**Location**: ใน `bootstrapLiffAuth()`
```ts
// BEFORE
if (isInClient && !liff.isLoggedIn()) {
  liff.login();
  return;
}

// AFTER
if (!liff.isLoggedIn()) {
  liff.login();
  return;
}
```
**หมายเหตุ**: LiffProvider.isInClient guard จะถูกลบออก แต่การเรียก `liff.login()` จาก LiffProvider จะไม่เกิดขึ้น เพราะ Phase 3 จะ skip LiffProvider บน `/liff` route อยู่แล้ว

**Critical Test Cases Phase 2**:
- [ ] (Integration) เปิด `/liff?mmv_next=%2Fprofile` ใน Browser → ต้อง redirect ไปหน้า LINE OAuth (ไม่ bounce กลับ home)
- [ ] (Unit) ทดสอบว่า `liff.login()` ถูก call เมื่อ `isLoggedIn() = false` โดยไม่ต้องเช็ค `isInClient()`

**Exit Criteria**: Browser user ถูกส่งไปหน้า LINE OAuth แทนที่จะ bounce กลับ home

---

### Phase 3 — Prevent Double Init Race (LiffProvider Guard)
**Objective**: ป้องกัน `LiffProvider` bootstrap บน `/liff` route เพื่อหลีกเลี่ยง Race Condition กับ `LiffGatewayClient`

#### Step 3.1 — `components/providers/liff-provider.tsx`
**Import เพิ่ม**: `usePathname` จาก `next/navigation`

**เพิ่ม pathname check ใน useEffect**:
```ts
// BEFORE
export function LiffProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!liffId || isPending || session?.user) {
      return;
    }
    // ... bootstrap logic

// AFTER
export function LiffProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    // Skip bootstrap on /liff route — LiffGatewayClient handles it exclusively
    if (!liffId || isPending || session?.user || pathname === '/liff') {
      return;
    }
    // ... bootstrap logic
```

**Critical Test Cases Phase 3**:
- [ ] `LiffProvider` render บน `/liff` → ต้องไม่เรียก `liff.init()`
- [ ] `LiffProvider` render บน `/` → ยังคง bootstrap ได้ปกติ (ถ้า user ไม่ล็อกอินและอยู่ใน LINE App)
- [ ] หลัง LiffGatewayClient เสร็จสิ้น navigate → ไม่มี `window.location.reload()` แทรก

**Exit Criteria**: ไม่มี Double Init บน `/liff` route

---

### Phase 4 — Update Tests
**Objective**: อัปเดต Test cases ให้สอดคล้องกับ `mmv_next` param ใหม่

#### Step 4.1 — `__tests__/middleware.test.ts`
ทุก Assertion ที่เช็ค `liff.state=` → เปลี่ยนเป็น `mmv_next=`

**Locations**:
- บรรทัด 38: `liff.state=${encodeURIComponent(path)}` → `mmv_next=${encodeURIComponent(path)}`
- บรรทัด 90: `liff.state=%2Fhistory%3Ftab%3Dall%26from%3Dline` → `mmv_next=%2Fhistory%3Ftab%3Dall%26from%3Dline`
- บรรทัด 94: `createRequest('/liff?liff.state=%2Fprofile')` → `createRequest('/liff?mmv_next=%2Fprofile')`

#### Step 4.2 — `__tests__/lib/liff-phase1.test.ts`
ทุก Assertion ที่เช็ค `liff.state=` → เปลี่ยนเป็น `mmv_next=`

**Locations**:
- `'/liff?liff.state=%2Fhistory%3Fref%3DABC123'` → `'/liff?mmv_next=%2Fhistory%3Fref%3DABC123'`
- `'/liff?liff.state=%2F'` → `'/liff?mmv_next=%2F'`

**Exit Criteria**: `bun run test` ผ่าน 100% ไม่มี test ที่รู้จัก `liff.state` เป็น param อีก

---

### Phase 5 — Hard Gate (Build + Lint + Test)
**Objective**: ตรวจสอบ integrity ของทั้งระบบก่อนส่งมอบ

#### Step 5.1 — Type Check + Build
```bash
cd /Users/non/dev/opilot/projects/mmv-tarots
npm run build
```
**Pass criteria**: ✅ No TypeScript errors, build succeeds

#### Step 5.2 — Lint
```bash
npm run lint
```
**Pass criteria**: ✅ No ESLint errors

#### Step 5.3 — Tests
```bash
bun run test
```
**Pass criteria**: ✅ All tests pass (middleware + liff-phase1 + others)

---

## ⚠️ Risks & Rollback

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| LIFF SDK `liff.login()` บน Browser ต้องการ HTTPS → Error ใน Dev | 🟡 Medium | ทดสอบบน Vercel Preview URL แทน localhost |
| `liff.login()` ไม่มี param `redirectUri` ใน LiffProvider → redirect ไปผิดหน้า | 🟡 Medium | LiffProvider ถูก skip บน `/liff` แล้ว ไม่กระทบ |
| `sessionStorage` dedup ทำงานข้าม tab ไม่ได้ (per-tab) | 🟢 Low | acceptable, แต่ต้องระวังกรณี token expired + user ยังมี stale dedup key |
| Double cookie set (verify เรียก 2 ครั้ง ถ้า race ยังเกิด) | 🟢 Low | Phase 3 แก้ race แล้ว + DB `session.create` แต่ละครั้ง token ไม่ซ้ำ |

**Rollback Strategy**: `git revert` commit ที่ทำในแต่ละ Phase หรือ `git reset --hard 6b8a9c8`

---

## 🔑 Dependency Order
```
Phase 1 (rename param) → Phase 2 (fix guard) → Phase 3 (fix race) → Phase 4 (update tests) → Phase 5 (hard gate)
```
Phase 1-3 ต้องทำตามลำดับ เพราะ Phase 3 ต้องรู้ว่า Phase 2 แก้ Guard อย่างไร

---

## 🔢 Commit Checkpoints (ตามนโยบาย ggg)
- `chore(#MMV-PHASE-5-8): rename liff.state → mmv_next across middleware, nav-provider, liff-page`
- `fix(#MMV-PHASE-5-8): remove isInClient guard to unblock browser login`
- `fix(#MMV-PHASE-5-8): skip liff-provider bootstrap on /liff route to prevent race`
- `test(#MMV-PHASE-5-8): update liff.state → mmv_next in all test assertions`

---

## ✅ Phase Progress Update
**Timestamp**: 2026-03-09 06:56 (+07)

- Phase 1: DONE
- Implemented in commit: `8608b78`
- Hard Gate result for this phase scope: `npm run build` ✅, `npm run lint` ✅, `bun run test` ✅ (134/134)

**Timestamp**: 2026-03-09 07:01 (+07)

- Phase 2: DONE
- Implemented in commit: `bc9b826`
- Hard Gate result for this phase scope: `npm run build` ✅, `npm run lint` ✅, `bun run test` ✅ (134/134)

**Timestamp**: 2026-03-09 07:49 (+07)

- Phase 3: DONE
- Implemented in commit: `c535492`
- Hard Gate result for this phase scope: `npm run build` ✅, `npm run lint` ✅, `bun run test` ✅ (134/134)

**Timestamp**: 2026-03-09 07:52 (+07)

- Phase 4: DONE (validated; no additional code changes required)
- Phase 5: DONE (final hard gate re-run)
- Hard Gate result for this phase scope: `npm run build` ✅, `npm run lint` ✅, `bun run test` ✅ (134/134)
- Commit action: none (working tree clean; phase 4 changes already included in prior commit `8608b78`)
