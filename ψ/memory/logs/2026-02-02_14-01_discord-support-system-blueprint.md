# 🛡️ Mission Blueprint: Discord Support Ticket System (Simple + Robust)

**Objective**: ติดตั้งระบบแจ้งปัญหา (Support Ticket) ที่ดักจับ Context อัตโนมัติและส่งเข้า Discord เพื่อความรวดเร็วในการซัพพอร์ตลูกค้า
**Target Site**: `projects/mmv-tarots`
**Base Branch**: `staging`

## 1. Grounding
- **Current UI**: หน้า `/profile` มีดีไซน์แบบ Glassmorphism (Morning Mystic) โดยมีส่วนท้ายเป็นปุ่ม Sign Out
- **Placement**: ปุ่ม "แจ้งปัญหา" (Report Issue) จะถูกวางไว้ด้านล่างสุดของหน้า Profile (เหนือปุ่ม Sign Out เล็กน้อย) ในรูปแบบของปุ่มที่ดูไม่รบกวนสายตาแต่เข้าถึงง่าย
- **Tech Stack**: Next.js App Router (Better Auth) + Discord Webhooks.

## 2. The Plan (Phases)

### Phase 1: Security & Backend Service
- [ ] **API Proxy**: สร้าง `app/api/support/route.ts` เพื่อเป็นตัวกลางส่งข้อมูลไป Discord (ซ่อน Webhook URL ไว้ใน Environment Variable)
- [ ] **Env Setup**: เตรียม `DISCORD_WEBHOOK_URL` ใน `.env`

### Phase 2: Logic & Capture
- [ ] **Context Capture**: เขียนฟังก์ชันรวมข้อมูลอัตโนมัติ (User ID, Name, OS, Browser, Viewport Size, Current URL)
- [ ] **Message Formatting**: จัดรูปแบบข้อความ Discord Embed ให้สวยงาม (มีสีแยกตามประเภทปัญหา เช่น Bug = แดง, Feedback = เขียว)

### Phase 3: UI Implementation
- [ ] **Support Button**: เพิ่มปุ่ม "แจ้งปัญหา / Support" ในหน้า `/profile/page.tsx`
- [ ] **Feedback Modal**: ใช้ `components/ui/modal.tsx` ที่มีอยู่แล้ว สร้างแบบฟอร์มสั้นๆ (เลือกหัวข้อ + พิมพ์ปัญหา)
- [ ] **Success Feedback**: แสดง Toast แจ้งเมื่อส่งข้อมูลสำเร็จ

## 3. UI Placement (Mockup Insight)
ในหน้า [projects/mmv-tarots/app/profile/page.tsx](projects/mmv-tarots/app/profile/page.tsx):
- วางปุ่มเป็น `GlassButton` ขนาดเล็ก หรือ `link style` เหนือปุ่ม Sign Out
- ใช้ไอคอน `MessageSquareText` (lucide-react) เพื่อความสื่อความหมาย

## 4. Risks & Counter-arguments
- **Risk**: User อาจพิมพ์ภาษาไทยและ Discord แปลเพี้ยน
- **Counter**: ใช้ UTF-8 ปกติ Discord รองรับภาษาไทยได้สมบูรณ์แบบ
- **Risk**: BOT Spam
- **Counter**: ตรวจสอบ Session (Better Auth) ที่ฝั่ง API Route เพื่อให้มั่นใจว่าเป็น User จริงเท่านั้นที่ส่งได้

---

**Next Steps**: หากคุณนนท์ยืนยันแผนนี้ ผมจะเริ่มสร้าง API Route (Phase 1) ทันทีครับ!
