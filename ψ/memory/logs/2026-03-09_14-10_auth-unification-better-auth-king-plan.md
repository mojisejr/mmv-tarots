# Snapshot: LIFF Auth Unification (Better-Auth as King)

**Time**: 2026-03-09 14:10 +0700
**Context**: Option A strategy to resolve 401 and LIFF SDK conflicts by removing LiffProvider from global layout and using Better-Auth as the single source of truth for session state

## Objective
ทำความสะอาดระบบ Authentication สองระบบที่ขัดแย้งกัน (LIFF SDK และ Better-Auth) บนหน้าแรก (Homepage) โดยปรับสถาปัตยกรรมให้ **Better-Auth เป็นผู้ถือ Session หลัก (Single Source of Truth)** และจำกัดให้ LIFF SDK ทำงานเฉพาะหน้าที่กำหนดไว้ให้ (Gateway ที่หน้า `/liff`) เท่านั้น เพื่อแก้ปัญหาหน้าแรกรีโหลดติด 401 Unauthorized และแสดง Error "liff.init() was called with a current URL that is not related to the endpoint URL." อย่างเด็ดขาด

## Scope
- **In Scope**:
  - ลบ (ถอนราก) การเรียกใช้ `LiffProvider` ออกจาก Global Layout หรือหน้าที่ไม่เกี่ยวกับ Gateway `app/liff`
  - ปรับปรุงให้หน้าแรกพึ่งพาแค่ Session จาก Better-Auth
  - นำ Warning ตลอดจน Network Request ที่ยิงไป `/api/auth/liff-verify` โดยไม่จำเป็นออกไป
- **Out of Scope**:
  - การแก้ไข UI และ UX อื่นที่ไม่เกี่ยวกับกระบวนการ Login Loop หรือ Auth Noise บนหน้าแรก

## Phases
### Phase 1: ถอน LiffProvider ออกจาก Global Context
- **Deliverables**: ลบการ Inject `LiffProvider` ออกจาก `layout.tsx` (หรือตำแหน่ง Global อื่นที่ครอบไว้)
- **Exit Criteria**:
    - หน้าแรก ไม่มีสคริปต์ของ LIFF SDK ถูกดึงมา initialize และไม่มีข้อความ Warning "liff.init() was called with a current URL" 
    - ไม่เกิด Request `401 Unauthorized` ไปที่ `/api/auth/liff-verify` ซ้ำซ้อนตอนเปิดหน้าแรก
- **Critical Test Cases**:
    - ตรวจสอบ `layout.tsx` ไม่หลงเหลือ `LiffProvider`

### Phase 2: ควบคุมการทำงานให้เกิดเฉพาะในหน้า Gateway
- **Deliverables**: ให้เฉพาะ `app/liff/page.tsx` เท่านั้นที่เรียกใช้ `liff.init()` และรัน Flow Authentication ส่งต่อ Token ให้ Better-Auth อย่างสมบูรณ์
- **Exit Criteria**: 
    - เข้าใช้งานหน้าย่อยที่ถูกล็อกไว้จากฝั่ง Browser หรือการเข้าผ่าน LINE จะถูกโยนกลับมาหน้า `/liff` ได้ปกติ แล้ว Login ส่ง Session Handoff ไปยัง Better-Auth ได้ 
- **Critical Test Cases**:
    - เข้าผ่าน Browser หรือ LINE แล้วตรวจสอบ Handoff (Token -> Session) สามารถทำได้โดยไม่เด้ง Loop

### Phase 3: Cleanup เคลียร์ของเหลือและ Hard Gate
- **Deliverables**: ลบโค้ดเก่าภายใน `components/providers/liff-provider.tsx` หากมันไม่ได้ใช้แล้ว หรือรีแฟกเตอร์ให้อยู่แค่ขอบเขตของหน้า Gateway
- **Exit Criteria**: 
    - โค้ดสะอาด ทดสอบ Build/Lint ผ่าน
- **Critical Test Cases**:
    - npm run build รันผ่าน 
    - ไม่มี Dead code

## Risks & Countermeasures
- Risk: ผู้ใช้เก่าที่ค้าง Session แบบครึ่งๆ กลางๆ ของระบบเดิมอาจจะติดขัด
  - Countermeasure: ถ้ามีปัญหา Token ไม่ตรงกัน อาจบังคับ Logout แบบ Clear Storage ชั่วคราวบน Client

## Rollback Strategy
- หากมีปัญหา: `git revert` ทุก Commits กลับมายังจุดก่อนเริ่ม Phase (commit ล่าสุดก่อนเริ่มคือที่แก้ไขเรื่อง param `mmv_next`)

## Verification Strategy
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `bun run test`

## Tags
`plan` `mmv-tarots` `auth` `better-auth` `liff-auth`

## Phase Progress Update
**Timestamp**: 2026-03-09 14:19 (+07)

- Phase 1: DONE
- Change: Removed global `LiffProvider` wrapper from `app/layout.tsx`
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (134/134)

**Timestamp**: 2026-03-09 14:23 (+07)

- Phase 2: DONE
- Evidence: `liff.init()` usage validated to remain only in `app/liff/page.tsx`

- Phase 3: DONE
- Change: Removed unused file `components/providers/liff-provider.tsx` (dead code cleanup)
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (134/134)

