# Snapshot: Referral Code vs User ID Mismatch Discovery

**Time**: 2026-01-20 22:09
**Context**: Deep analysis of a failed referral case where a friend received only 1 star instead of 2.

## Insight

ปัญหาที่เพื่อนสมัครผ่านลิงก์แล้วได้เพียง 1 ดาว (ไม่ได้รับโบนัสมิตรภาพ) และไม่มี `referred_by_id` มีสาเหตุมาจาก **"ความสับสนระหว่าง User ID และ Referral Code"** 

เนื่องจากทั้งคู่ใช้รูปแบบ `cuid()` เหมือนกัน (เริ่มต้นด้วย `cmk...`) ทำให้ระบุได้ยากด้วยสายตา:
1.  User พยายามส่งลิงก์จาก `id` ของตนเองแทนที่จะเป็น `referralCode`
2.  Database ค้นหาในฟิลด์ `referralCode` -> ไม่พบ -> ระบบตัดสินใจปล่อยผ่านแบบ Silent Fallback เพื่อไม่ให้ขัดขวางการสมัคร (Robustness over strictness)
3.  User จึงได้รับการสมัครแบบปกติ (1 ดาว) โดยไม่มีการเชื่อมโยงระบบแนะนำ

การลบ Database (User/History) และลองใหม่ก็ยังติดปัญหาเดิมหากยังใช้ "รหัสที่ผิด" ตัวเดิม

## Apply When

- เมื่อออกแบบแชร์ลิงก์ (Sharing UI) ต้องระบุชื่อตัวแปรให้ชัดเจน (เช่น `shareableCode` ไม่ใช่แค่ `id`)
- เมื่อต้อง Debug ปัญหาระบบแนะนำที่ "ล้มเหลวเงียบๆ" ให้เช็ค Type/Format และค่าของ Code เป็นอันดับแรก
- พิจารณาระบบ Auto-lookup ทั้งสองฟิลด์ (Fallback) หากเป็นไปได้ในอนาคต

## Tags

`referral-bug` `cuid-confusion` `ux-gap` `mmv-tarots`
