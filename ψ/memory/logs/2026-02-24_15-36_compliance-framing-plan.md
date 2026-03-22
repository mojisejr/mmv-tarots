# 🛡️ Mission Blueprint: Compliance Framing & Enhanced Navigation

**Date**: 2026-02-24 15:36 +07
**Project**: [mmv-tarots](projects/mmv-tarots)
**Status**: ✅ Completed (Session 2026-02-25)
**Objective**: ปรับปรุงภาษาใน Onboarding ให้เป็นเชิง "Wellness/Guidance" เพื่อผ่านการ Audit จาก Omise และแก้ไข Link Navigation ให้เปิดใน Tab ใหม่เพื่อรักษา Flow ของ User

---

## 🏛️ Grounding context
- **Problem 1**: คำว่า "Tarot", "ดูดวง", "แม่นยำ" เป็นคำที่มีความเสี่ยงสูง (High Risk) ต่อการพิจารณาเปิดบัญชี Merchant ของ Omise
- **Problem 2**: ลิงก์นโยบายใน Modal เปิดในหน้าเดิม ทำให้ Onboarding Flow ขาดตอน และ Modal ซ้อนทับกันทำให้ผู้ใช้สับสน

---

## 🛠️ The Plan (Phases)

### Phase 1: Semantic Framing (Compliance Update) ✅
- **Files**: `constants/covenant-summary.ts`, `components/features/onboarding/WelcomeModal.tsx`
- **Action**:
    - เปลี่ยน **"MimiVibe Tarot"** ➔ **"MimiVibe: Your Persona Guidance"**
    - เปลี่ยน **"ดูดวง/ทำนาย"** ➔ **"Personalized Insight"** หรือ **"รับคำแนะนำ"**
    - เปลี่ยนข้อความใน Step Greeting และ Gift ให้เน้นเรื่อง **"Energy & Wellness Context"** แทนการกล่าวอ้างเรื่องความแม่นยำของโชคชะตา

### Phase 2: Navigation Refactor (External Links) ✅
- **Files**: `components/features/onboarding/WelcomeModal.tsx`
- **Action**:
    - แก้ไขคอมโพเนนต์ `<Link>` ในส่วนของ Policy ให้เพิ่ม `target="_blank"` และ `rel="noopener noreferrer"`
    - ตรวจสอบให้มั่นใจว่าการเปิด Tab ใหม่ไม่ไปรบกวนสถานะ (State) ของ Modal ที่ยังค้างอยู่

### Phase 3: Content Polish & Refinement ✅
- **Files**: `.tmp/mmv/text.md` (Update source for reference)
- **Action**:
    - ปรับปรุงข้อความพาดหัวให้ดูละมุนขึ้น เช่น "ยินดีด้วยคุณได้รับดาว" ➔ **"พลังงานแห่งดวงดาวเริ่มต้นนำทางคุณแล้ว"**

### Phase 4: Verification & Standard Gate ✅
- **Action**: 
    - รัน `npm run build` เพื่อตรวจสอบความสมบูรณ์
    - รัน `npm run lint` เพื่อให้มั่นใจว่าไม่มี Type error จากการเปลี่ยน Constants
    - **Fix**: ป้องกัน Modal กลับมาบังหน้า Policy เมื่อเปิดในหน้าต่างใหม่ (WelcomeRitual path exclusion)

---

## 🛡️ Risk & Strategy
- **Audit Defense**: หากทีมงาน Omise เข้ามาตรวจหน้า Sandbox/Live จะเห็นแอปในเชิง "Life Coaching / Self-Reflection" ซึ่งได้รับอนุญาตง่ายกว่าแอปสายการพนันหรือความเชื่องมงาย
- **User Retention**: การเปิด Tab ใหม่ช่วยให้ผู้ใช้ไม่หลุดออกจากแอปหลักขณะที่กำลังจะเปลี่ยนผ่านจาก Onboarding เข้าสู่หน้า Home

---
*Created by Oracle Keeper for @คุณนนท์*
