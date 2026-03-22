# Snapshot: Final Implementation Blueprint - Suggested Questions (v1.1)

**Time**: 2026-01-15 11:27
**Context**: แผนการอิมพลีเมนต์ระบบคำถามแนะนำ (Suggested Question Chips) ฉบับสมบูรณ์ ครอบคลุมทั้ง Backend, Frontend และ UX

## 🛡️ Mission Blueprint: The Guided Mystic

### Phase 1: Sacred Foundation (Database & Service)
- **Prisma Schema**: เพิ่ม Model `SuggestedQuestion` พร้อมฟิลด์ `text`, `category`, `isActive`
- **Migration**: รัน `npx prisma migrate dev` เพื่ออัปเดตฐานข้อมูล
- **Service Layer**: สร้าง `services/suggested-question-service.ts` เพื่อจัดการการดึงข้อมูลแบบสุ่มหรือแบบ Cache-friendly

### Phase 2: Knowledge Conduit (API & Caching)
- **API Endpoint**: สร้าง `GET /api/suggested-questions`
- **Caching Strategy**: ใช้ Next.js Cache Tags หรือ ISR เพื่อให้ดึงข้อมูลครั้งเดียวต่อชั่วโมง ช่วยลดภาระ DB
- **Output**: ส่งคำถามออกมาเป็นชุดใหญ่ (Bundle) เพื่อให้ Client นำไปสุ่มต่อ

### Phase 3: The Presence (UI Component)
- **Component**: สร้าง `@/components/features/suggested-questions.tsx`
- **Styling**: Glassmorphism (`bg-glass-mimi`, `backdrop-blur-2xl`) และ Horizontal Scroll สำหรับ Mobile
- **Logic**: รับข้อมูลคำถามมาสุ่ม (Shuffle) และแสดงผล 3-4 ข้อทุครั้งที่หน้าจอโหลด
- **Interaction**: เมื่อคลิก -> ทำการ Auto-fill ลงใน `QuestionInput` และเน้นการ Fade-out เมื่อผู้ใช้เริ่มพิมพ์เอง

### Phase 4: Integration (The Home Page)
- **Placement**: วาง Component ไว้เหนือ `QuestionInput` ในหน้า `Home`
- **Conditional Rendering**: แสดงเฉพาะเมื่อช่อง Input ว่างและมีการ Focus
- **Verification**: รัน Build และเช็คความลื่นไหลบนมือถือ (Physical Mobile Check)

## ⚡ CONSENSUS_SCHEMA
- **Component Placement**: Above `QuestionInput`, below `FloatingBadge`.
- **Data Hook**: `useSuggestedQuestions` (SWR หรือ TanStack Query สำหรับการ Fetch ที่ลื่นไหล).
- **Animation**: `animate-fade-in-up` (.8s cubic-bezier).

## Apply When
- เมื่อเริ่มขั้นตอนการโค้ดฟีเจอร์คำถามแนะนำใน mmv-tarots (v1.1)
- ใช้เป็น Checklist ในการตรวจสอบความเรียบร้อยของงานแต่ละเฟส

## Tags
`implementation-plan` `blueprint` `mmv-tarots` `full-stack` `ux-design`
