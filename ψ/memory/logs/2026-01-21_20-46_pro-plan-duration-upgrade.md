# Snapshot: Pro Plan Upgrade & MaxDuration Increase

**Time**: 2026-01-21 20:46
**Context**: อัปเกรดโครงการ mmv-tarots เป็น Vercel Pro Plan เพื่อแก้ปัญหา Latency และ Timeout สำหรับผู้ใช้ต่างประเทศ

## Insight

1.  **Requirement**: ผู้ใช้ในต่างประเทศ (EU/US) ประสบปัญหา Timeout 10 วินาทีของแพลน Hobby เนื่องจากระยะทางไปยัง DB สิงคโปร์ และ Cold Start ของ Neon
2.  **Action**: 
    *   อัปเกรดเป็น Pro Plan 
    *   สร้างไฟล์ `vercel.json` เพื่อกำหนด `maxDuration: 60` สำหรับ API routes ทั้งหมด
3.  **Impact**: ระบบจะสามารถรอการประมวลผลและการส่งข้อมูลข้ามทวีปได้นานสูงสุด 60 วินาที ป้องกันปัญหาหน้าเว็บพัง (504 Gateway Timeout) ระหว่างกระบวนการ Login

## Apply When

- เมื่อมีการใช้งาน Pro Plan และต้องการเพิ่มขีดจำกัดเวลาทำงานของ Serverless Functions

## Tags

`vercel-pro` `maxDuration` `latency-fix` `mmv-tarots`
