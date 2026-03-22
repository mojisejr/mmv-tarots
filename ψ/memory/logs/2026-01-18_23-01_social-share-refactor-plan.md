# Snapshot: แผนการ Refactor Social Share UI (mmv-tarots)

**Time**: 2026-01-18 23:01
**Context**: เตรียมเปลี่ยนปุ่ม Share จากรูปแบบ Native (Web Share API) เป็นชุดไอคอน 3 แอป (FB, X, TikTok) เพื่อความสวยงามและคุม Branding ได้ดีขึ้น

## แผนการดำเนินงาน (Mission Blueprint)

1.  **Preparation**: เตรียม URL Intents สำหรับแต่ละแพลตฟอร์ม
    - Facebook: `sharer.php`
    - X: `intent/tweet`
    - TikTok: ระบบ Copy Link อัตโนมัติ (Fallback) พร้อม Toast แจ้งเตือน
2.  **UI Transformation**:
    - สร้างปุ่มแบบไอคอน 3 ปุ่มเรียงแนวนอน
    - ใช้ธีม Glassmorphism ขอบมน (rounded-2xl) และ Gilded effect (accent/gold tokens)
    - ใช้ `Lucide React` สำหรับไอคอน
3.  **Technical Logic**:
    - จัดการ URL Encoding สำหรับ Referral Link ให้ถูกต้อง
    - ตรวจสอบ `npm run build` และ Linter ให้ผ่าน 100% (The Hard Gate)

## เป้าหมาย (Success Criteria)

- UX ลื่นไหลขึ้น ดูเป็นระบบ (Systematic) ไม่โดดออกมาจากธีมหมอดูของแอป
- รองรับการแทร็ก Referral ผ่าน Query Params (`ref=...`) ได้ทุกแพลตฟอร์ม

## Tags

`planning` `social-share` `ui-design` `mmv-tarots`
