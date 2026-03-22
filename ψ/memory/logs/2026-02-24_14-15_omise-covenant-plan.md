# Snapshot: Mission Plan - The Covenant (Omise Compliance UX)

**Date**: 2026-02-24 14:15 +07
**Project**: `mmv-tarots`
**Status**: ✅ Completed (Session 2026-02-25)

## 🎯 Objective
ยกระดับความเข้มงวดของระบบการยอมรับเงื่อนไข (Compliance) ในหน้า Welcome Ritual พร้อมกับปรับปรุง UX โดยการย้ายจุดแสดงผลนโยบายจาก Footer/Package ไปไว้ใน Profile Page เพื่อความสะอาดตาและเป็นระเบียบ

## 🛠️ Plan Details

### 0. Legal UX Refactor (Optimization) ✅
- **Site Footer**: นำรายการลิงก์นโยบายออกจาก `SiteFooter` เพื่อลดความเทอะทะ (Simple) แต่ยังคงข้อมูลติดต่อและ disclaimer เล็กน้อยไว้
- **Profile Page**: เพิ่มหมวดหมู่ "ข้อมูลทางกฎหมายและนโยบาย" (Legal & Policies) ในหน้า Profile เพื่อให้ผู้ใช้ที่ Login แล้วสามารถตรวจสอบได้ตลอดเวลา
- **Package Page**: พิจารณาลดทอน Checkbox ในหน้า Package ลงหากระบบ Welcome Modal Gating ทำงานได้สมบูรณ์แล้ว เพื่อลดขั้นตอนการจ่ายเงิน (Friction)

### 1. New Interaction Flow ✅
- **Step 4: The Covenant**: แทรกระหว่างหน้าได้รับของขวัญ (Gift) และหน้าสุดท้ายใน Welcome Ritual
- **UI Element**: `ScrollableSummary` แสดงข้อกำหนดที่สำคัญ
- **Gate**: ปุ่ม "ไปดูดวง" จะไม่ทำงานจนกว่าผู้ใช้จะกด Checkbox ยอมรับนโยบายทั้ง 3 (Refund, TOS, Privacy) ใน Modal นี้ ครั้งเดียวตอนเริ่มต้น

### 2. Legal Summarization ✅
- **Refund Focus**: ย้ำชัดเจนว่า Stars คือ Digital Tokens ที่ไม่สามารถคืนเงินได้
- **Nature of Service**: ระบุเป็นคำแนะนำเพื่อความบันเทิง/แนวทางชีวิต (Mental Wellness/Consultation)
- **Data Usage**: ยืนยันการเก็บข้อมูลตามมาตรฐาน PDPA

### 3. Implementation Target
- File: `projects/mmv-tarots/components/features/onboarding/WelcomeModal.tsx`
- Branch: `feature/omise-compliance-gate`

## � 2. The Plan (Phases)

### Phase 0: Policy UI Refactor (UX Cleanup) ✅
- [x] **Footer Cleanup**: แก้ไข `components/layout/site-footer.tsx` นำลิงก์ Refund/Terms/Privacy ออก
- [x] **Profile Menu**: แก้ไข `app/profile/page.tsx` เพิ่ม Section ใหม่สำหรับลิงก์กฎหมาย (ใช้ Icon สื่อความหมาย)

### Phase 1: Summary Content Preparation ✅
- [x] **Content Logic**: ร่างข้อความ "พันธสัญญาแห่งดวงดาว" (The Covenant Summary) ที่สรุปใจความสำคัญจาก Refund, ToS, และ Privacy

### Phase 2: Updating Component State ✅
- [x] **WelcomeModal Refactor**: อัปเดต `Step` type และเพิ่ม State สำหรับการ Checkbox (`covenantAccepted`)

### Phase 3: The Covenant UI Implementation (Step 4) ✅
- [x] **UI Step 4**: เพิ่มหน้าจอใหม่ใน `WelcomeModal` พร้อม Scrollable content และ Checkbox
- [x] **Gate Logic**: ปลดล็อคปุ่ม "ไปดูดวง" เมื่อ Checkbox ถูกติ๊ก

### Phase 4: Final Polish & Verification ✅
- [x] **Hard Gate Check**: รัน `npm run build` และ `npm run lint` เพื่อยืนยันความเสถียร
- [x] **Path Exclusion Fix**: ตรวจสอบและแก้ไขบั๊ก Path Exclusion สำหรับหน้า Policy (`/policy`) เพื่อป้องกัน Modal กางซ้อนเมื่อเปิด Tab ใหม่

## �🛡️ Oracle Standard Check
- ✅ **Nothing is Deleted**: เราเพียงแค่เพิ่ม Step เข้าไปใน Component เดิม
- ✅ **Patterns Over Intentions**: ใช้ UI Pattern เดิม (`GlassCard`, `GlassButton`) เพื่อความต่อเนื่อง
- ✅ **Hard Gate**: บังคับยอมรับเงื่อนไขจริง (Active Consent) ก่อนเปิดระบบให้ใช้งาน

*Logged by Oracle Keeper | #mmv-tarots #omise-compliance #ux-upgrade*
