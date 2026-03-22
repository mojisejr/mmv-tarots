# Snapshot: Commercial Launch & Support Strategy for mmv-tarots

**Time**: 2026-02-01 22:50
**Context**: การวางแผนเตรียมตัวปล่อยเว็บไซต์ mmv-tarots สู่สาธารณะ (Production) และการออกแบบระบบ Support

## Insight

กลยุทธ์การขยายผลจากโปรเจกต์ทดสอบสู่การขายจริง โดยเน้นความเรียบง่ายแต่ทนทาน (Simple + Robust):

### 1. Technical Foundation (Ready)
- **Sentry Monitoring**: ติดตั้งระบบดักจับ Error ครบทุกส่วน (Phase 1-3) พร้อมล้างไฟล์ทดสอบแล้ว
- **Referral Persistence**: แก้ไขปัญหา Browser Isolation ใน LINE In-App Browser (IAB) ทำให้ระบบแนะนำเพื่อนทำงานได้เสถียรบนมือถือ

### 2. Social Launch Strategy (The MimiVibe Wave)
- **Storytelling**: เน้นการเล่า "ที่มาและความตั้งใจ" ของเว็บเพื่อให้ได้พลังงานบวก (Positive Vibe)
- **Viral Loop**: ชูจุดเด่น "ดูฟรีเมื่อชวนเพื่อน" เพื่อดึงศักยภาพของระบบ Referral ที่พึ่งปรับปรุงไป
- **Platform Focus**: 
  - TikTok/Shorts: โชว์ UI ความงามของไพ่ (Visual Appeal)
  - LINE Groups: แหล่งรวมกลุ่มเป้าหมาย (สายมู) โดยตรง

### 3. Support Interface (Simple + Robust)
- **LINE Official Account (Primary)**:
  - ใช้ Rich Menu เพื่อทำ FAQ ตอบคำถามอัตโนมัติ (กรองคำถามได้ 80%)
  - วางลิงก์ติดต่อแอดมินไว้ที่ Web Footer
- **In-App Feedback Button (Secondary)**:
  - เพิ่มปุ่ม "แจ้งปัญหา" ในหน้า Profile เพื่อดักจับ User Context (User ID, Browser)
  - ส่งข้อมูลแจ้งเตือนผ่าน LINE Notify เพื่อการตอบสนองที่รวดเร็ว

### 4. Pre-launch Checklist
- [ ] ตรวจสอบ Canonical URL ใน Vercel ให้เป็น Domain จริง (`www.mimivibe-tarot.com`)
- [ ] ตรวจสอบรูป OG Image สำหรับการแชร์ลง Social
- [ ] ตั้งค่า Google Analytics หรือ Vercel Analytics เพื่อวัดผล Growth

## Apply When
- เมื่อต้องการ Recap สถานะการเตรียมตัวก่อน Launch
- เมื่อต้องการออกแบบระบบ Customer Support สำหรับ Solo-developer Project

## Tags
`commercial-launch` `support-strategy` `line-oa` `mmv-tarots` `production-ready` `referral-ready`
