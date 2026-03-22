# Snapshot: The Triple Star Glitch & Referral Desync

**Time**: 2026-01-19 21:55
**Context**: Investigation of multiple star rewards and UI desync after P2028 fix.

## Insight

ปัญหาเกิดจาก "Over-Parallelization" และ "Missing Idempotency":
1. **Auth Hook (Fire & Forget)**: ทำการแจกรางวัล (Onboarding + Referral Bonus) ทันทีหลังสร้าง User ในระดับ Database แต่ Client ยังไม่รับรู้เพราะ Session ถูกส่งออกไปก่อน
2. **Onboarding API (Ritual Gate)**: ทำการแจกรางวัล Onboarding ซ้ำซ้อนเพราะไม่ได้เช็คประวัติการแจกเดิม
3. **Desync**: Client ถือ Session เก่า (0-1 ดาว) ในขณะที่ DB เป็น 3 ดาว ผลคือ UI แสดงผลขัดแย้งกันจนกว่าจะมีการ Refresh หน้าจอหรือเข้าหน้า History ที่ Fetch ข้อมูลใหม่
4. **Referral Integrity**: สถานะ `PENDING` ใน History ขัดแย้งกับ `SUCCESS` ใน Transaction ของบุคคลนั้น (Referee)

## Apply When

- เมื่อมีการออกแบบระบบแจกรางวัลที่ทำงานแบบ Asynchronous
- เมื่อต้องจัดการกับ User Experience ในจังหวะแรกเข้า (Onboarding)
- เมื่อต้องแก้ปัญหา Transaction Deadlock โดยไม่ทำลายความถูกต้องของข้อมูล

## Tags

`bug` `star-desync` `referral-logic` `idempotency` `mmv-tarots`
