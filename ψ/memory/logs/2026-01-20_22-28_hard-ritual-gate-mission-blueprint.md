# Snapshot: Mission Blueprint - Hard Ritual Gate Implementation

**Time**: 2026-01-20 22:28
**Context**: ยกระดับระบบ Onboarding ให้เป็น Hard Gate เพื่อรับประกันความถูกต้องของข้อมูล (Data Integrity) และป้องกัน User ข้ามขั้นตอนการรับรางวัล

## 🛡️ Strategic Phases

### Phase 1: The Lockdown (UI Level)
**Objective**: ปิดทุกลู่ทางการหนีออกจาก Modal โดยไม่ได้รัน API
- **File**: `projects/mmv-tarots/components/features/onboarding/WelcomeModal.tsx`
- **Changes**:
    - ลบปุ่มปิด (X) ออกจากหัวข้อ Modal
    - ตั้งค่า `onOpenChange` ของ Dialog ให้เป็น `() => {}` (No-op)
    - ปิดการทำงานของ `onInteractOutside` และ `onEscapeKeyDown` (ถ้าระบบพื้นฐานอนุญาต)
    - บังคับให้การปิดเกิดขึ้นได้ทางเดียวคือผ่านปุ่ม "รับพร" เท่านั้น

### Phase 2: The One-Way Valve (Logic Level)
**Objective**: จัดการสถานะการทำธุรกรรมให้ Robust และมีทางออกเมื่อเกิด Error
- **File**: `projects/mmv-tarots/components/features/onboarding/WelcomeRitual.tsx`
- **Changes**:
    - แยก Logic การปิด Modal ออกจาก Logic การเริ่มทำพิธี
    - เพิ่ม `isSuccess` state: Modal จะปิดลงได้ก็ต่อเมื่อ API ตอบกลับว่า `success: true`
    - เพิ่ม Error Handling: หาก API พัง (500/Network error) ต้องแสดงปุ่ม "ลองอีกครั้ง" แทนการติดแหง็ก (Deadlock Prevention)

### Phase 3: The Hard Gate (Verification)
**Objective**: ตรวจสอบคุณภาพและความปลอดภัย
- **Test Cases**:
    - [ ] กด ESC ต้องไม่ปิด
    - [ ] กดนอกพื้นที่ Modal ต้องไม่ปิด
    - [ ] ตัดเน็ตแล้วกดรับพร ต้องขึ้น Error และปุ่มให้ลองใหม่
    - [ ] เมื่อ API สำเร็จ ต้องได้รับดาว (1 หรือ 2 ตามเคส) และ Modal ปิดลงอย่างนุ่มนวล

## 💎 Integrity Goal
เพื่อให้ระบบ "Ritual Gate" ทำหน้าที่เป็นด่านหน้าทางกฎเกณฑ์ (Business Logic Anchor) ที่เข้มแข็งที่สุด ลดปัญหา "Orphan Users" และเพิ่มความศักดิ์สิทธิ์ให้กับการเริ่มต้นใช้งาน

## Tags
`hard-gate` `ux-design` `onboarding` `reliability` `mmv-tarots`
