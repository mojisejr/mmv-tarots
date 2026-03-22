# Snapshot: Referral System Audit - Success & Lesson Learned

**Time**: 2026-01-12 14:49
**Context**: Manual testing of the newly implemented "Starter Star" and "Delayed Reward" referral system in `mmv-tarots`.

## Insight

### 1. The Lesson (The "ID vs Code" Trap)
ในการทดสอบช่วงแรก พบว่าระบบไม่แจกดาวตามแผน ทำให้เกิดความสงสัยในความถูกต้องของ Logic แต่จากการตรวจสอบพบว่าเป็น **Human Error** ในการเลือกใช้ Data:
- **Mistake**: นำ `User.id` (internal UUID/cuid) ไปใช้เป็นรหัสชวนเพื่อนใน URL
- **Fact**: ระบบถูกออกแบบให้ใช้ `User.referralCode` (รหัสแยกต่างหากเพื่อความปลอดภัย)
- **Lesson**: การแยก Public Identifier (Referral Code) ออกจาก Internal ID เป็น Best Practice แต่ต้องการการสื่อสารที่ชัดเจนในขั้นตอนการพัฒนา/ทดสอบ

### 2. The Success (System Integrity)
หลังแก้ไขข้อมูลการทดสอบ ระบบทำงานได้อย่างสมบูรณ์ตาม Schema:
- **Onboarding Success**: รับ 1 ดาวทันที (Universal Bonus)
- **Referral Entry Success**: รับเพิ่มอีก 1 ดาวทันทีเมื่อมีผู้แนะนำ (Total 2 Stars)
- **Delayed Reward Success**: เมื่ออ่านคำทำนายจบครั้งแรก:
    - **Referee**: ได้รับคืน +1 ดาว (ทำให้สรุปแล้วอ่านฟรีได้ 3 ครั้ง: 1 เดิม + 2 โบนัส)
    - **Referrer**: ได้รับโบนัส +2 ดาว (ตรวจสอบผ่าน `ReferralHistory` และ `CreditTransaction`)

## Apply When
- เมื่อต้องพัฒนาหรือทดสอบระบบที่มีรหัสอ้างอิงหลายชุด (รหัสภายใน vs รหัสภายนอก)
- ใช้เป็น Reference สำหรับ "Star Journey" ของ User ในการทำ Marketing/UX

## Tags
`referral-system` `success` `lesson-learned` `mmv-tarots` `integrity-audit`