# Snapshot: mmv-tarots Auth Architecture Analysis & Redesign Options

**Time**: 2026-03-09 15:14 +0700
**Context**: หลัง Auth Unification Phase 1-3 พบว่า login flow ยังมี bug ซับซ้อน 3 ตัวและ UX loop ไม่จบ วิเคราะห์ root cause และ propose 3 ทางออกก่อนเลือก approach และ /ppp

---

## Evidence: 3 Root Cause Bugs ที่พบ

### Bug 1 — `isLoggingIn` ค้าง (Memory Leak / Loading indicator loop)
- **File**: `lib/client/providers/navigation-provider.tsx` ฟังก์ชัน `handleLoginClick()`
- **Mechanism**: `setIsLoggingIn(true)` ถูก set เมื่อกด Login แต่ไม่มีการ set กลับเป็น `false` หลัง component unmount/remount จาก redirect
- **Symptom**: ปุ่ม Login ค้าง loading indicator หลัง redirect กลับมา Homepage แบบ infinite

### Bug 2 — Cookie Format Mismatch (Session บางครั้งเห็นบางครั้งไม่เห็น)
- **Files**: `app/api/auth/liff-verify/route.ts` + `lib/client/auth-client.ts`
- **Mechanism**: Custom route ทำ Cookie serialization เองด้วย `serializeSignedCookie` ของ `better-call` ขณะที่ `useSession()` ของ Better-Auth client ตรวจสอบผ่าน `/api/auth/session` ซึ่งอาจ verify signature ด้วย internal key ที่ format ไม่ตรงกัน
- **Symptom**: Refresh หน้าบางครั้งเข้าได้ บางครั้งกลับมา login พฤติกรรมไม่ deterministic

### Bug 3 — `mmv_next` Target หาย (redirect กลับ `/` เสมอ)
- **File**: `app/liff/page.tsx` ฟังก์ชัน `runGateway()`
- **Mechanism**: เมื่อ LINE OAuth redirect กลับ URL จะเป็น `/liff` ล้วนๆ ไม่มี `mmv_next` (เพราะ LIFF SDK จัดการ URL เองระหว่าง OAuth flow) → `buildGatewayTarget()` return `/` → ไม่ redirect ไปที่ต้องการ
- **Symptom**: หลัง login สำเร็จ ไม่ถูก redirect ไปหน้าเป้าหมาย กลับหน้าแรกเสมอ

---

## Architecture Overview: ปัจจุบัน (7 ชั้น = ซับซ้อนเกินไป)

```
User กด Login
  → navigation-provider.handleLoginClick() [set isLoggingIn=true]
  → buildLiffGatewayPath() → router.push(/liff?mmv_next=...)
  → app/liff/page.tsx [liff.init() → liff.login() → LINE OAuth]
  → LINE redirect กลับ /liff [mmv_next หาย]
  → api/auth/liff-verify [verify token + สร้าง session + set cookie เอง]
  → router.replace(target='/')
  → useSession() [อ่าน cookie ผ่าน Better-Auth — อาจ format ไม่ตรง]
```

---

## 3 Redesign Options

### Option A — Patch 3 Bug ที่มีอยู่ (เร็วที่สุด)
- แก้ `isLoggingIn` reset ใน navigation-provider
- แก้ Cookie serialization ให้ใช้ Better-Auth's internal `createSession` API แทน custom cookie
- แก้ `mmv_next` ให้ encode ผ่าน LIFF SDK state string อย่างถูกต้อง
- **Pro**: ไม่ต้อง refactor ใหญ่ **Con**: ยังมีความซับซ้อนในโครงสร้างเดิม

### Option B — LIFF → Custom JWT Cookie (แนะนำ ⭐ สำหรับ LIFF-first app)
- ยก Better-Auth ออกทั้งยวง
- หน้า `/liff` init LIFF → Verify AccessToken ที่ Server → Server ออก **JWT Cookie** เอง (userId, lineId, exp 7d)
- Middleware อ่าน JWT Cookie ตรงๆ ไม่ต้องง Better-Auth client
- ทุก API Route อ่าน JWT จาก Cookie ตรงๆ
- **Pro**: เบา, ง่าย, ไม่มี Race Condition, เหมาะกับ LINE App ใช้งานหลัก **Con**: ต้องเขียน JWT utility 30-40 บรรทัด

### Option C — LIFF Access Token เป็น Bearer ตลอด (Stateless)
- ทุก API call ส่ง `Authorization: Bearer <liff_access_token>` ตรงๆ
- Server verify กับ LINE API ทุก request
- **Pro**: ง่ายสุด ไม่มี session state **Con**: ช้า (ยิง LINE API ทุก Request), Token หมดอายุเร็ว

---

## Decisive Context
- Usage pattern: **ใช้ใน LINE App เป็นหลัก** (Browser เป็น edge case)
- Feature dependencies ที่ต้องคิดถึง: Referral system, Stars/Credits, Onboarding, Session-gated APIs
- Better-Auth ถูกใช้จริงแค่ใน 2 จุด: `useSession()` ใน NavigationProvider + Middleware cookie check

## Apply When
- ทำ Login Redesign ครั้งหน้า ให้เลือก **Option B** ถ้า Use Case ยังเน้น LINE App
- Apply Option A เฉพาะถ้าต้องการ Hotfix เร็วโดยไม่ refactor ใหญ่
- ห้ามเพิ่ม Provider/SDK Layer อีกในระบบนี้จนกว่าจะ stabilize

## Next Actions
- [ ] คุณนนท์ confirm แนวทาง (A, B หรือ C)
- [ ] ร่าง `/ppp` implementation blueprint ตามแนวที่เลือก
- [ ] Phase 1: ถ้าเลือก B ให้เริ่มที่ `lib/server/jwt.ts` (utility) + ปรับ `/api/auth/liff-verify` + Middleware

## Tags
`snapshot` `mmv-tarots` `auth` `liff` `better-auth` `jwt` `redesign` `root-cause` `architecture-decision`
