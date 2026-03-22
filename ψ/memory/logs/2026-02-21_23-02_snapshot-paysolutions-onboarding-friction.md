# 📸 Snapshot: Pay Solutions Onboarding Friction & Strategic Re-evaluation

**Date**: 2026-02-21 23:02 GMT+7
**Project**: [mmv-tarots](projects/mmv-tarots)
**Status**: ⏸️ Payment Integration PAUSED/STALLED

## 🔍 The Blocker
จากการทดลองสมัครและประสานงานกับ **Pay Solutions** พบอุปสรรคสำคัญ (Friction) ที่ทำให้การขยับไปสู่ระบบ Automated Payment ติดขัด:
1.  **Strict Onboarding Policy**: มีเงื่อนไขว่าธุรกิจต้อง "เคยมีรายการขาย" หรือ "มี Order History" มาก่อนถึงจะสมัครผ่านได้ ซึ่งขัดแย้งกับสถานะของ `mmv-tarots` ที่เป็น Service ใหม่แกะกล่องที่กำลังจะ Launch.
2.  **KYC Complexity**: กระบวนการตรวจสอบตัวตน (Know Your Customer) และเอกสารมีความยุ่งยากสูงกว่าที่คาดการณ์ไว้สำหรับบัญชีบุคคลธรรมดา.
3.  **The "Chicken and Egg" Problem**: เราไม่สามารถเปิดรับชำระเงินอัตโนมัติได้หากไม่มีประวัติ และเราก็สร้างประวัติได้ยากหากไม่มีระบบรับชำระเงินที่สะดวก.

## 🛡️ Oracle Assessment
- **Integration Risk**: การฝืนใช้ระบบ Automated ที่เงื่อนไขสูงในตอนนี้อาจทำให้เสียเวลา (Opportunity Cost) และไม่สอดคล้องกับแนวทาง **Lean/Simple** ของโปรเจกต์.
- **Strategic Pivot Suggestion**: ควรพิจารณาระบบ **"Manual/Hybrid Payment"** (เช่น การแสดงเลขบัญชี/QR และให้ User Upload Slip) เพื่อสร้าง Transaction History ก่อนในช่วงแรก (Initial Traction).
- **Framing**: แม้จะ Re-frame ธุรกิจแล้ว แต่เกณฑ์ของ Gateway ในไทยกำลังเข้มงวดขึ้นอย่างเห็นได้ชัด (หลังการควบรวม Xendit/GB Prime).

## 📝 Next Steps
- [ ] สรุปยอดรายการธุรกรรมที่จำเป็นต้องมีเพื่อให้ผ่านเกณฑ์ (ถ้าจะไปต่อกับ Pay Solutions).
- [ ] ออกแบบ **Simplified Payment Flow** (Slip-Upload) เพื่อใช้เป็น Phase 1.0 แทน Automated Integration.
- [ ] เก็บ Pay Solutions ไว้เป็น "เป้าหมายระยะสอง" เมื่อธุรกิจเริ่มมีกระแสเงินสดจริง.

---
*Snapshot captured by Oracle-Keeper at the request of คุณนนท์*
