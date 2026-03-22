---
type: plan
project: mmv-tarots
task_id: "#universal-referral"
status: active
tags: [plan, blueprint, referral]
related_files: [lib/referral-utils.ts, middleware.ts, app/liff/page.tsx]
---

## 🎯 Objective & Scope
เปลี่ยนระบบการสร้าง Referral Link จากเดิมที่เจาะจงเฉพาะ LINE/LIFF มาเป็น **Universal Link (www.maemormimi.com)** เพื่อรองรับการใช้งานบน Browser, Google, Facebook และ Platforms อื่นๆ โดยยังรักษาความเข้ากันได้กับ LINE (LIFF) ผ่านระบบ Tracking Cookie

**Scope:**
- ปรับปรุง `ReferralUtils` ให้สร้างลิงก์เป็น Canonical Web URL เสมอ
- ตรวจสอบ/ปรับแต่ง `middleware.ts` ให้เก็บ Cookie ข้ามไปมาระหว่าง Web และ LIFF ได้อย่างแม่นยำ
- ปรับปรุง `liff/page.tsx` (Gateway) ให้ดึงข้อมูลผู้แนะนำจาก Cookie มาใช้งานกรณีที่ User เข้าผ่าน LINE
- อัปเดต UI ในหน้า Profile และหน้าแชร์ต่างๆ ให้แสดงผลลิงก์ใหม่

## 🏗️ Architecture Design

### 1. Data Flow (The Proxy Pattern)
1. **User Clicks**: `https://maemormimi.com?ref=USER_ID`
2. **Middleware**:
   - ตรวจพบ `?ref=...`
   - ฝั่ง Cookie `mmv_ref` (HttpOnly, Secure, 30 days, SameSite=Lax)
3. **Login Phase**:
   - ไม่ว่าจะ Login ด้วย Google หรือ LINE ระบบจะดึง Cookie นี้ไปบันทึก Referral Reward ผ่าน `/api/auth/referral-check`

### 2. LIFF Integration
- เมื่อลิงก์เปิดใน LINE App (Standard Window) -> Middleware ทำงานตามปกติ
- หาก User กด "Login with LINE" เข้าสู่หน้า `/liff` -> ระบบจะรักษา Cookie ไว้จนกว่าจะคุยกับ `liff-verify` สำเร็จ

## 📅 Implementation Phases

### Phase 1: Core Logic Update (Grounding)
- [ ] เปลี่ยน `ReferralUtils.generateLink` ให้เลิกใช้ `liff.line.me` prefix และใช้ `window.location.origin` หรือ `NEXT_PUBLIC_APP_URL` แทน
- [ ] เพิ่ม `NEXT_PUBLIC_APP_URL` ใน `.env` (ถ้ายังไม่มี) เพื่อใช้เป็นฐานของลิงก์แชร์
- **Test Case**: เรียกใช้ `ReferralUtils.generateLink()` แล้วได้ลิงก์รูปแบบ `https://maemormimi.com?ref=...` เสมอ

### Phase 2: Middleware & Cookie Guard
- [ ] ตรวจสอบ `middleware.ts` ให้แน่ใจว่า `SameSite=Lax` ถูกตั้งค่าเพื่อให้ Cookie ติดตามไปถึงตอน Redirect กลับมาจาก Auth Provider
- [ ] เพิ่มระบบ Logging ใน Middleware (ชั่วคราว) เพื่อดูว่า `ref` ถูกเก็บเข้า Cookie จริงไหมในสภาพแวดล้อมต่างๆ
- **Test Case**: เปิดลิ้งก์ที่มี `ref` ใน Incognito Browser แล้วเช็คว่ามี `mmv_ref` cookie เกิดขึ้นไหม

### Phase 3: LIFF Gateway Refactor
- [ ] ปรับปรุง `liff/page.tsx` ให้ใช้ `ReferralUtils` ในการ Build target URL
- [ ] ตรวจสอบจุดที่ส่งต่อ `mmv_next` ให้ยังคงรักษา Referral context ไว้
- **Test Case**: เข้าผ่าน LIFF URL เดิมที่มี `?ref=...` แล้วระบบยังคงฝัง Cookie และ Redirect ไปหน้าเป้าหมายได้ถูกต้อง

### Phase 4: UI/UX & Share Experience
- [ ] อัปเดตปุ่ม "Copy Link" ในหน้า Profile ให้พ่น New Universal Link
- [ ] ตรวจสอบฟังก์ชันแชร์ไพ่ (Prediction Sharing) ให้ใช้ลิงก์ใหม่
- **Test Case**: กด Copy Link แล้ววางใน Note/Chat ต้องได้ลิงก์ `www` ไม่ใช่ `liff.line.me`

## 🛡️ Hard Gate & Verification
- **Build**: `npm run build` ต้องผ่าน (ไม่มี Broken Imports)
- **Lint**: `npm run lint` ต้องผ่าน
- **Cookie Presence**: ทดสอบใน Chrome DevTools ว่า Cookie `mmv_ref` ถูกตั้งค่าทันทีที่เข้าหน้า Home ด้วย `?ref=...`

## ⚠️ Risks & Rollback
- **Risk**: User เก่าที่จำลิงก์ `liff.line.me` เดิมอาจจะงง (แต่ลิงก์เดิมจะยังทำงานได้เพราะ LIFF URL จะ Redirect มาที่เว็บอยู่ดี)
- **Rollback**: หากระบบ Cookie มีปัญหาในบาง Mobile Browser ให้กลับไปใช้การส่ง `ref` ผ่าน URL Params สำรอง

---

## 🧭 Deep Grounding Addendum (2026-03-12 21:50 +07)

> วัตถุประสงค์ของ Addendum นี้คือ “ล็อกความจริงของระบบปัจจุบัน (As-Is)” และปรับแผนให้ตรงกับ **Journey ที่ต้องคงไว้**:
> - ผู้รับลิงก์ต้องผ่าน Gate ก่อนเข้าถึงประสบการณ์หลัก
> - สิทธิ์ผู้รับได้ครั้งเดียว (Recipient One-time)
> - ผู้ชวนให้สิทธิ์ได้หลายครั้ง (Referrer Multi-invite)
> - หน้า **Ritual Welcome** ต้องคงอยู่เป็นส่วนสำคัญของ Journey

### 1) As-Is Ground Truth (จากโค้ดจริง)

- `lib/referral-utils.ts`
   - ปัจจุบัน `generateLink()` ยังคืนค่าเป็น `https://liff.line.me/...` เมื่อมี `NEXT_PUBLIC_LIFF_ID`
   - ถ้าไม่มี `NEXT_PUBLIC_LIFF_ID` จึง fallback เป็น `origin + path`
- `middleware.ts`
   - เก็บ first-touch cookie `mmv_ref` แบบไม่ overwrite ค่าเดิม
   - ค่าคุกกี้: `httpOnly`, `sameSite: 'lax'`, `secure` เฉพาะ production, `maxAge` 30 วัน
   - เส้นทาง protected (`/profile`, `/history`, `/package`, `/submitted`) ถูก redirect ไป `/liff?mmv_next=...` เมื่อไม่มี session
- `app/liff/page.tsx`
   - รองรับการส่งต่อ `ref` จาก query ของ `/liff` ไป target (`buildGatewayTarget`)
   - หาก target มี `ref` อยู่แล้ว จะไม่ overwrite
- `app/api/user/onboarding/route.ts`
   - เป็น **Ritual Gate** หลัก: เช็ค `onboardingCompleted` แบบ idempotent
   - มี self-healing referral linkage จาก cookie `mmv_ref` หาก auth hook พลาด
   - reward ปัจจุบัน: onboarding bonus + referral entry bonus (เมื่อมี referrer)
- `lib/server/auth.ts`
   - auth hook (`databaseHooks.user.create.after`) อ่าน `mmv_ref` แล้วบันทึก linkage ผ่าน `referralService.processReferralSignup`
   - เป็น non-blocking background flow
- `app/api/auth/referral-check/route.ts` + `app/profile/page.tsx`
   - ยังมี legacy flow: profile load เรียก `/api/auth/referral-check` เพื่อ apply referral reward
   - เสี่ยงเกิดความซ้ำซ้อนเชิงสถาปัตย์กับ Ritual Gate แม้มี idempotency ป้องกันบางชั้น

### 2) Journey Contract (ต้องคงไว้)

- **Recipient Side**
   - รับ referral ผ่านลิงก์ -> ระบบเก็บ `mmv_ref` -> ต้องผ่าน Gate/Login ก่อนเข้าสู่ประสบการณ์ทำนายหลัก
   - Ritual Welcome แสดงเฉพาะผู้ที่ยังไม่ onboarding สำเร็จ
   - สิทธิ์ผู้รับต้องได้เพียงครั้งเดียว (one-time entitlement)
- **Referrer Side**
   - ผู้ชวนยังสามารถเชิญได้หลายคน (multi-invite)
   - เครดิตของผู้ชวนต้องมาจาก referral linkage ที่ valid และผ่านกติกาป้องกัน abuse

### 3) Revised Refactor Direction (Design-accurate)

#### Phase A: Universal Link Canonicalization (ไม่แตะ Business Rule)
- เปลี่ยน `ReferralUtils.generateLink()` ให้คืน canonical web URL เป็นค่าเริ่มต้น
- เพิ่ม safe base URL strategy: `NEXT_PUBLIC_APP_URL` (fallback) และ `window.location.origin`
- คง query/path behavior เดิมให้ครบ (append `ref`, preserve existing query)

#### Phase B: Gate Consistency (คง Ritual Journey เดิม)
- ยืนยันว่า onboarding API เป็นแหล่ง truth หลักของ recipient first reward
- นิยาม `/api/auth/referral-check` เป็น legacy path ที่ต้องไม่สร้างผลซ้ำเชิงตรรกะ
- ตอกย้ำ idempotency rule สำหรับ recipient one-time entitlement

#### Phase C: LIFF Gateway Compatibility
- คง behavior เดิมของ `/liff` ที่ forward target อย่างปลอดภัย
- ปรับให้รองรับ referral context แม้ entry มาจาก universal web flow
- ห้ามทำให้เกิด redirect loop หรือ override `ref` ที่ผู้ใช้ถืออยู่แล้ว

#### Phase D: UI/Share Surface Alignment
- `app/profile/page.tsx` และ `components/reading/share-actions.tsx` ต้องใช้ลิงก์ universal แบบเดียวกัน
- UX copy ยังสื่อ promise เดิม (ผู้รับได้สิทธิ์ครั้งแรก, ผู้ชวนสะสมได้หลายครั้ง)

### 4) Unit Test Matrix (ต้องทำก่อนปิดงาน)

#### A. Referral Link Contract Tests
- แก้/เพิ่มใน `__tests__/lib/referral-phase2.test.ts`
   - `generateLink()` ต้องคืน `https://maemormimi.com...` เมื่อกำหนด app url
   - preserve query params + append `ref` ถูกต้อง
   - เมื่อไม่มี `ref` ต้องไม่สร้าง query เกินจำเป็น

#### B. Middleware Referral Cookie Tests
- ขยาย `__tests__/middleware.test.ts`
   - first-touch only (ไม่ overwrite)
   - cookie flags (`sameSite=lax`, `httpOnly`) ตรงตาม contract
   - protected route redirect ยังถือ `mmv_next` ได้ครบ query เดิม

#### C. LIFF Gateway Safety Tests
- ใช้ `__tests__/lib/liff-phase1.test.ts`
   - forward `ref` เฉพาะกรณี target ไม่มี `ref`
   - malformed state ต้อง fallback `/`
   - persisted target flow ยังทำงานเมื่อ `mmv_next` หาย

#### D. Ritual Gate / Referral Idempotency Tests
- เพิ่ม unit/integration สำหรับ `app/api/user/onboarding/route.ts` (ใหม่)
   - onboarding ซ้ำต้องไม่ให้ reward ซ้ำ
   - self-healing linkage ต้องผูก `referredById` ได้เมื่อ cookie มีค่า
   - reward response ต้องสะท้อนกรณีมี/ไม่มี referrer อย่างแม่นยำ

### 5) Definition of Done (Refactor Mission)

- Universal share link ใช้งานได้จริงบน Browser/Google/Facebook โดยไม่แตก flow เดิม
- Recipient one-time entitlement คงเดิม
- Ritual Welcome Journey คงเดิม
- ไม่มี duplicate reward จากการชนกันของเส้นทางเก่า/ใหม่
- ผ่าน hard gate: `npm run build`, `npm run lint`, และชุด unit tests ที่ปรับใหม่

---

## 🧭 Deep Grounding Addendum #2 (2026-03-12 22:09 +07)

> เป้าหมายของ Addendum #2 คือปรับแผนให้ตรงกับมติล่าสุด:
> - คง **Referral Link** เป็นช่องทางหลักเหมือนเดิม
> - เพิ่ม **Referral Code** เป็น safety fallback สำหรับกรณี link หลุด/ข้ามบริบท
> - ลดความซับซ้อนฝั่ง LIFF โดยหลีกเลี่ยง flow ที่ต้อง rely กับ redirect ซับซ้อน

### 1) Reality Snapshot (ยืนยันจากโค้ดปัจจุบัน)

- `projects/mmv-tarots/lib/referral-utils.ts`
   - `generateLink()` ยัง preference เป็น `liff.line.me` เมื่อมี `NEXT_PUBLIC_LIFF_ID`
   - `shareText.prediction()` และ `shareText.invite()` ยังไม่มีการฝัง referral code ในข้อความ
- `projects/mmv-tarots/app/profile/page.tsx`
   - มี `handleCopyReferralLink()` แล้ว (copy/share link)
   - ยังไม่มีปุ่ม `Copy Referral Code` แยกชัดเจน
   - ยังไม่มี input สำหรับผู้ใช้ที่ต้องการ claim referral ย้อนหลังด้วย code
- `projects/mmv-tarots/components/reading/share-actions.tsx`
   - มีปุ่ม Social + Copy Link สำหรับหน้าแชร์คำทำนาย
   - ยังไม่มี LIFF-aware mode สำหรับเน้น copy code/copy payload
- `projects/mmv-tarots/app/liff/page.tsx`
   - gateway ยังคงเน้น `mmv_next` + optional `ref` forwarding
   - ยังไม่มี UX guidance ว่าใน LINE ควรใช้ referral code แบบ manual fallback
- `projects/mmv-tarots/middleware.ts`
   - first-touch `mmv_ref` cookie ทำงานถูกหลักอยู่แล้ว (`httpOnly`, `sameSite=lax`, non-overwrite)

### 2) Product Decision Patch (มติล่าสุด)

#### Core Policy: Hybrid Share Contract
- ใช้ **Referral Link** เป็น primary channel (default)
- เพิ่ม **Referral Code** เป็น secondary channel (fallback)
- ทุกจุดที่ user กดแชร์ ควรสามารถส่งต่อได้ทั้ง link และ code ใน context เดียวกัน

#### LIFF Simplification Policy
- ถ้า detect ว่าอยู่ใน LIFF/WebView ของ LINE:
   - เน้น UX แบบ `Copy Code`/`Copy Full Message`
   - ลดการพึ่ง social intent redirect ที่อาจทำ context หลุด
- เป้าหมายคือให้ผู้รับปลายทางสามารถกรอก code เองได้เมื่อ link ไม่เสถียร

### 3) Revised Phasing (ต่อจาก Phase A-D เดิม)

#### Phase E: Hybrid Referral Surface (Link + Code)
- [ ] เพิ่ม `ReferralUtils` helper สำหรับ compose share payload ที่มีทั้ง `link` และ `code`
- [ ] ปรับ `shareText.invite()` และ `shareText.prediction()` ให้รองรับข้อความแบบ dual-format
- [ ] ที่หน้า Profile เพิ่มปุ่ม `Copy Referral Code` แยกจาก `Copy Link`
- [ ] ที่หน้าแชร์คำทำนาย (`share-actions`) เพิ่ม action สำหรับคัดลอกข้อความเต็ม (รวม code)

#### Phase F: Manual Claim Slot for Missed First Click
- [ ] เพิ่ม input ใน Profile สำหรับกรอก referral code (เฉพาะผู้ที่ยังไม่มี `referredById`)
- [ ] ใส่เงื่อนไข one-time claim ให้สอดคล้องกับ recipient entitlement เดิม
- [ ] กำหนด API contract ชัดเจนว่า claim ได้เฉพาะก่อน/ภายในเงื่อนไข onboarding gate ที่อนุญาต
- [ ] เพิ่ม validation: ป้องกัน self-referral, ป้องกัน overwrite linkage ที่ถูกผูกแล้ว

#### Phase G: LIFF-Aware UX Branch
- [ ] เพิ่ม LIFF environment detection utility (client-side)
- [ ] ถ้า LIFF mode: ปรับลำดับ CTA ให้ `Copy Code` เด่นกว่า `Copy Link`
- [ ] เพิ่ม helper copy message เช่น:
   - "ลิงก์ใช้งาน: ..."
   - "ถ้าลิงก์เข้าไม่ได้ ให้กรอกรหัสนี้: ..."
- [ ] หลีกเลี่ยงการเพิ่ม redirect loop ใหม่ใน gateway

### 4) Detailed Acceptance Criteria (เพิ่มจาก DoD เดิม)

#### A. Hybrid Share UX Contract
- ผู้ใช้ต้องเห็นทั้ง `Copy Link` และ `Copy Code` ใน profile referral card
- ผู้ใช้ต้องคัดลอกข้อความแชร์ที่มีทั้ง link+code ได้จากหน้าแชร์คำทำนาย
- กรณีไม่มี referralCode ใน session UI ต้อง degrade gracefully (ไม่พัง)

#### B. Manual Claim Guardrail
- ผู้ใช้ที่มี `referredById` แล้ว ต้องไม่เห็น/ใช้ claim input ได้
- claim สำเร็จได้เพียงครั้งเดียวตาม one-time entitlement
- claim ด้วย code ผิด/หมดสิทธิ์ต้องได้ข้อความ error ที่ชัดเจน

#### C. LIFF-Safe Behavior
- เมื่ออยู่ใน LIFF, CTA หลักต้องไม่บังคับ social redirect
- copy payload ใน LIFF ต้องนำไปใช้งานต่อในแชท LINE ได้จริง
- ไม่มี regression ต่อ `mmv_next` และ referral forwarding flow เดิม

### 5) Test Matrix Delta (เพิ่มจากชุดเดิม)

#### E. Share Payload Tests
- เพิ่ม test ให้ `ReferralUtils` คืน payload ที่มีทั้ง `url` และ `code`
- ทดสอบข้อความแชร์แบบ dual-format ว่าฝัง code ถูกต้อง

#### F. Profile Referral UI Tests
- เพิ่ม test ปุ่ม `Copy Referral Code`
- เพิ่ม test conditional rendering ของ claim input จากสถานะ user

#### G. Manual Claim Flow Tests
- กรณี claim สำเร็จครั้งแรก
- กรณี claim ซ้ำ (ต้องถูกปฏิเสธ)
- กรณี self-referral/invalid code

#### H. LIFF Branch Tests
- mock LIFF env แล้ว assert ว่า CTA priority เปลี่ยนเป็น code-first
- non-LIFF env ต้องยังแสดง link-first ตามปกติ

### 6) Rollout Note

- Addendum นี้เป็น **plan patch only** (ยังไม่เปลี่ยนโค้ด)
- ลำดับลงมือแนะนำ:
   1) Phase A (canonical link)
   2) Phase E (hybrid share surface)
   3) Phase F (manual claim slot)
   4) Phase G (LIFF-aware UX)

---

## 🧩 Phase Clarity Patch (2026-03-12 22:39 +07)

> จุดประสงค์ของ patch นี้คือทำให้ทีมและ agent เห็นตรงกันว่าแผนนี้มี **Execution Phases เดียว** เพื่อลดความสับสนตอน implement

### 1) สรุปสั้นที่สุด: ตอนนี้มีกี่ Phase?

- แผนที่ใช้ลงมือจริงมีทั้งหมด **7 phases**: `A, B, C, D, E, F, G`
- `Phase 1-4` ด้านบนถือเป็น **initial draft (historical baseline)**
- `Phase A-D` คือ refined core ที่แทน 1-4
- `Phase E-G` คือ extension จากมติล่าสุด (Hybrid Link+Code + Manual Claim + LIFF-aware UX)

### 2) Canonical Execution Order (ให้ agent ยึดชุดนี้)

1. **Phase A**: Universal Link Canonicalization
2. **Phase B**: Gate Consistency (Ritual Gate เป็น truth หลัก)
3. **Phase C**: LIFF Gateway Compatibility
4. **Phase D**: UI/Share Surface Alignment (link-universal)
5. **Phase E**: Hybrid Referral Surface (Link + Code)
6. **Phase F**: Manual Claim Slot for Missed First Click
7. **Phase G**: LIFF-Aware UX Branch

### 3) Mapping จาก Phase เดิม (เพื่อกันการตีความผิด)

- `Phase 1` เดิม -> `Phase A`
- `Phase 2` เดิม -> `Phase B`
- `Phase 3` เดิม -> `Phase C`
- `Phase 4` เดิม -> `Phase D` + บางส่วนของ `Phase E`

### 4) Agent Implementation Guardrail

- เวลาลงมือ implement ให้ refer เฉพาะ `Phase A-G` เท่านั้น
- ห้ามเปิดงานจาก `Phase 1-4` โดยตรง (ใช้แค่อ่านบริบทย้อนหลัง)
- Test execution ให้รันตาม matrix เดิมแบบสะสม: `A-D` ก่อน แล้วเพิ่ม delta `E-H`
- หากมีการเพิ่ม requirement ใหม่ ให้ append เป็น `Phase H+` แทนการสร้างชุดเลขใหม่

### 5) Practical Rollout (ลด risk)

- **Wave 1 (foundation):** `A -> B -> C`
- **Wave 2 (visible UX):** `D -> E`
- **Wave 3 (policy fallback):** `F -> G`
- Hard gate ปิดงานทั้งก้อน: `build + lint + updated tests`

---

## ✅ Phase Execution Update (2026-03-12 22:44 +07)

### Phase A Status: DONE

- `Phase A` ถูก implement แล้วในโค้ดจริง
- Canonical behavior ที่ลงแล้ว:
   - `ReferralUtils.generateLink()` ใช้ `NEXT_PUBLIC_APP_URL` เป็น base หลัก
   - fallback ไป `origin` เมื่อไม่มี `NEXT_PUBLIC_APP_URL`
   - คงการ append `ref` และ preserve query/path ตามเดิม
   - ตัด LIFF-first generation (`liff.line.me/...`) ออกจาก path หลักของการสร้างลิงก์แชร์

### Hard Gate Evidence (Phase A)

- Build: ✅ `npm run build` ผ่าน
- Lint: ✅ `npm run lint` ผ่าน
- Test: ✅ `npm test` ผ่าน (`24 files`, `138 tests`)

### Files Touched in Phase A

- `projects/mmv-tarots/lib/referral-utils.ts`
- `projects/mmv-tarots/__tests__/lib/referral-phase2.test.ts`

---

## ✅ Phase Execution Update (2026-03-12 22:51 +07)

### Phase B Status: DONE

- `Phase B` ถูก implement แล้วในโค้ดจริง
- Gate consistency ที่ลงแล้ว:
   - `app/api/auth/referral-check/route.ts` ถูกปรับเป็น legacy no-op endpoint
   - ตัด side-effect ที่เคยเรียก `CreditService.applyReferralReward(...)`
   - ย้าย decision ของ referral entitlement ให้ผูกกับ onboarding gate ตาม policy
   - `app/profile/page.tsx` หยุดยิง `/api/auth/referral-check` ตอน page load

### Hard Gate Evidence (Phase B)

- Build: ✅ `npm run build` ผ่าน
- Lint: ✅ `npm run lint` ผ่าน
- Test: ✅ `npm test` ผ่าน (`25 files`, `140 tests`)

### Files Touched in Phase B

- `projects/mmv-tarots/app/api/auth/referral-check/route.ts`
- `projects/mmv-tarots/app/profile/page.tsx`
- `projects/mmv-tarots/__tests__/api/referral-check-route.test.ts`

---

## ✅ Phase Execution Update (2026-03-12 23:07 +07)

### Phase C Status: DONE

- `Phase C` ถูก implement แล้วในโค้ดจริง
- LIFF gateway compatibility ที่ลงแล้ว:
   - `app/liff/page.tsx` เพิ่ม durable referral recovery จาก `persistedTarget`
   - รองรับกรณี `mmv_next` หล่น query ระหว่าง flow แล้วกู้ `ref` กลับได้อย่างปลอดภัย
   - คงกติกาเดิม: ถ้า target มี `ref` อยู่แล้ว จะไม่ override
   - คง safe target policy เดิม (ไม่ยอมรับ external URL และไม่เพิ่ม redirect loop)

### Hard Gate Evidence (Phase C)

- Build: ✅ `npm run build` ผ่าน
- Lint: ✅ `npm run lint` ผ่าน
- Test: ✅ `npm test` ผ่าน (`25 files`, `142 tests`)

### Files Touched in Phase C

- `projects/mmv-tarots/app/liff/page.tsx`
- `projects/mmv-tarots/__tests__/lib/liff-phase1.test.ts`

---

## ✅ Phase Execution Update (2026-03-12 23:15 +07)

### Phase D Status: DONE

- `Phase D` ถูก implement แล้วในโค้ดจริง
- UI/Share alignment ที่ลงแล้ว:
   - สร้าง helper กลางใน `ReferralUtils` สำหรับลิงก์แชร์ 2 แบบ (`generateInviteLink`, `generatePredictionLink`)
   - `app/profile/page.tsx` ใช้ helper ใหม่ทั้งในส่วนแสดงลิงก์และปุ่ม copy/share
   - `components/reading/share-actions.tsx` ใช้ helper ใหม่สำหรับลิงก์หน้า `/share/:id`
   - ลดความเสี่ยง drift ของ logic การประกอบลิงก์ระหว่างหน้า Profile กับ Share Surface

### Hard Gate Evidence (Phase D)

- Build: ✅ `npm run build` ผ่าน
- Lint: ✅ `npm run lint` ผ่าน
- Test: ✅ `npm test` ผ่าน (`25 files`, `144 tests`)

### Files Touched in Phase D

- `projects/mmv-tarots/lib/referral-utils.ts`
- `projects/mmv-tarots/app/profile/page.tsx`
- `projects/mmv-tarots/components/reading/share-actions.tsx`
- `projects/mmv-tarots/__tests__/lib/referral-phase2.test.ts`

---

## ✅ Phase Execution Update (2026-03-12 23:20 +07)

### Phase E Status: DONE

- `Phase E` ถูก implement แล้วในโค้ดจริง
- Hybrid referral surface ที่ลงแล้ว:
   - เพิ่ม `ReferralUtils.composeInvitePayload(...)` และ `ReferralUtils.composePredictionPayload(...)` เพื่อคืน payload แบบ `url + code + text + message`
   - เพิ่ม `ReferralUtils.formatShareMessage(...)` ให้ข้อความแชร์แนบทั้งลิงก์และ fallback code ในฟอร์แมตเดียวกัน
   - ปรับ `shareText.invite()` และ `shareText.prediction()` ให้รองรับ referral code fallback
   - `app/profile/page.tsx` เพิ่มปุ่ม `Copy Referral Code` แยกจาก `Copy Link`
   - `components/reading/share-actions.tsx` เพิ่ม action `Copy Message` เพื่อคัดลอกข้อความเต็ม (ลิงก์ + รหัส)

### Hard Gate Evidence (Phase E)

- Build: ✅ `npm run build` ผ่าน
- Lint: ✅ `npm run lint` ผ่าน
- Test: ✅ `npm test` ผ่าน (`25 files`, `146 tests`)

### Files Touched in Phase E

- `projects/mmv-tarots/lib/referral-utils.ts`
- `projects/mmv-tarots/app/profile/page.tsx`
- `projects/mmv-tarots/components/reading/share-actions.tsx`
- `projects/mmv-tarots/__tests__/lib/referral-phase2.test.ts`

---

## ✅ Phase Execution Update (2026-03-12 23:39 +07)

### Phase F Status: DONE

- `Phase F` ถูก implement แล้วในโค้ดจริง
- Manual claim slot + one-time guardrail ที่ลงแล้ว:
   - เพิ่ม endpoint `POST /api/user/referral-claim` เพื่อรับ referral code แบบ manual
   - บังคับเงื่อนไข claim: ต้องยังไม่มี `referredById` และยังไม่ `onboardingCompleted`
   - เพิ่ม validation สำคัญ: ป้องกัน self-referral, ปฏิเสธ invalid code, และไม่ให้ overwrite linkage เดิม
   - `app/api/user/me` ส่ง `referredById` และ `onboardingCompleted` เพื่อให้ UI ตัดสิน eligibility ได้ถูกต้อง
   - `app/profile/page.tsx` เพิ่ม input/action สำหรับกรอกรหัส referral (แสดงเฉพาะผู้ที่ยัง claim ได้)

### Hard Gate Evidence (Phase F)

- Build: ✅ `npm run build` ผ่าน
- Lint: ✅ `npm run lint` ผ่าน
- Test: ✅ `npm test` ผ่าน (`26 files`, `153 tests`)

### Files Touched in Phase F

- `projects/mmv-tarots/app/api/user/referral-claim/route.ts`
- `projects/mmv-tarots/app/api/user/me/route.ts`
- `projects/mmv-tarots/app/profile/page.tsx`
- `projects/mmv-tarots/__tests__/api/referral-claim-route.test.ts`

---

## ✅ Phase Execution Update (2026-03-12 23:46 +07)

### Phase G Status: DONE

- `Phase G` ถูก implement แล้วในโค้ดจริง
- LIFF-aware UX branch ที่ลงแล้ว:
   - เพิ่ม utility `isLiffEnvironment(...)` สำหรับตรวจ LIFF/WebView context ฝั่ง client
   - เพิ่ม utility `resolveShareActionOrder(...)` เพื่อกำหนด CTA priority ตาม environment
   - `components/reading/share-actions.tsx` รองรับ action `Copy Code` และ reorder CTA
      - LIFF: `Copy Code -> Copy Message -> Copy Link -> Social`
      - Non-LIFF: `Copy Link -> Copy Message -> Social -> Copy Code`
   - `app/profile/page.tsx` ปรับ visual emphasis ของปุ่ม `Copy Referral Code` เมื่ออยู่ใน LIFF mode

### Hard Gate Evidence (Phase G)

- Build: ✅ `npm run build` ผ่าน
- Lint: ✅ `npm run lint` ผ่าน
- Test: ✅ `npm test` ผ่าน (`28 files`, `159 tests`)

### Files Touched in Phase G

- `projects/mmv-tarots/lib/client/liff-environment.ts`
- `projects/mmv-tarots/lib/client/share-action-order.ts`
- `projects/mmv-tarots/components/reading/share-actions.tsx`
- `projects/mmv-tarots/app/profile/page.tsx`
- `projects/mmv-tarots/__tests__/lib/liff-environment.test.ts`
- `projects/mmv-tarots/__tests__/components/reading/share-actions-priority.test.ts`
