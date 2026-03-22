# Snapshot: Suggested Question Technical Architecture (v1.1)

**Time**: 2026-01-15 11:24
**Context**: ออกแบบสถาปัตยกรรมทางเทคนิคสำหรับระบบคำถามแนะนำ (Suggested Question Chips) โดยเน้นความเร็วและการขยายผล (Scalability)

## Insight

จากการสำรวจ Codebase สรุปว่าแนวทาง **"Level 2: Database + Service Layer"** เหมาะสมที่สุดสำหรับ mmv-tarots เนื่องจากรักษาความเร็วหน้าแรกได้ (Zero Loading Impact) และสอดคล้องกับโครงสร้างเดิม

### 1. Database Schema (Prisma)
- **Table**: `SuggestedQuestion`
- **Fields**: 
    - `id`: String (cuid)
    - `text`: String (คำถามแนะนำ)
    - `category`: String (หมวดหมู่ เช่น general, career, love)
    - `isActive`: Boolean (สำหรับเปิด/ปิดการแสดงผล)
    - `updatedAt`: DateTime (สำหรับระบบ Cache Revalidation)

### 2. Efficiency Strategy (Bundle Fetch + Client Shuffle)
- **Server Side**: ใช้ Service Layer ดึงคำถามแบบสุ่มหรือชุดใหญ่ (Bundle) มาจาก Database 
- **Caching**: ใช้ Next.js ISR (`revalidate: 3600`) หรือ API Caching เพื่อลดภาระ Database
- **Client Side**: รับข้อมูลชุดใหญ่มา (เช่น 20-30 ข้อ) แล้วใช้ JavaScript สุ่มเลือกมาแสดงผลเพียง 3-4 ข้อทุครั้งที่ Refresh
- **Impact**: Loading Time หน้าแรกจะไม่เพิ่มขึ้น (0ms db latency) และประหยัด Database Connection

### 3. Service Layer Integration
- เพิ่ม `SuggestedQuestionService` ใน `services/` เพื่อจัดการ CRUD
- รักษา Pattern "Simple yet Robust" ของ Oracle Framework

## Apply When

- เมื่อเริ่มสร้าง Migration สำหรับ Prisma Table ใหม่
- เมื่อเริ่มพัฒนา API Endpoint สำหรับดึงคำถามแนะนำ
- เมื่อต้องการแก้ไขชุดคำถามแนะนำผ่าน Database (Prisma Studio) โดยไม่ต้อง Deploy ใหม่

## Tags

`backend-architecture` `prisma` `nextjs-isr` `performance-optimization` `mmv-tarots`
