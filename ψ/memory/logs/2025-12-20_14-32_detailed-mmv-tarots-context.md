---
project: mmv-tarots
issue: #none
tags: []
date: 2025-12-20
agent: oracle-keeper
---

# Detailed Snapshot: mmv-tarots Technical Architecture & Context
**Date**: 2025-12-20
**Time**: 14:32
**Issue**: #none
**Model**: Gemini 3 Flash (Free Tier)

## 1. Project Overview & Philosophy
- **Project**: mmv-tarots (MimiVibe)
- **Core Concept**: AI-powered Tarot Reading with a "Fire-and-Forget" architecture.
- **Tech Stack**: 
  - **Framework**: Next.js 16 (App Router)
  - **Runtime**: Vercel Serverless
  - **Workflow**: Vercel Workflow (Asynchronous processing)
  - **Database**: Neon PostgreSQL via Prisma
  - **AI**: Vercel AI SDK (Google Gemini 2.5 Flash/Pro)
  - **UI**: Tailwind CSS, Framer Motion, Three.js (for 3D elements)

## 2. Backend Architecture (Deep Dive)

### 2.1 API Endpoints
- **POST `/api/predict`**: 
  - รับคำถามจาก User, ตรวจสอบความถูกต้อง (Validation).
  - สร้าง `jobId` (format: `job-{timestamp}-{random}`).
  - บันทึกสถานะ `PENDING` ลง DB.
  - Trigger `startTarotWorkflow` แบบไม่รอผล (Async).
- **GET `/api/predict/[jobId]`**:
  - ตรวจสอบสถานะงาน (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
  - ถ้าเสร็จแล้ว จะส่งผลลัพธ์ที่ผ่านการ Adapt ข้อมูล (`reading-adapter`) กลับไป.
- **GET `/api/predictions/user/[userId]`**:
  - ดึงประวัติการทำนายล่าสุด 50 รายการของ User.

### 2.2 Workflow Pipeline (`app/workflows/tarot.ts`)
1. **Status Update**: เปลี่ยนเป็น `PROCESSING`.
2. **Gatekeeper Agent**: ตรวจสอบความเหมาะสมของคำถาม (Safety & Relevance).
3. **Analyst Agent**: วิเคราะห์ Mood, Topic, Period และสร้าง Context สำหรับการทำนาย.
4. **Mystic Agent**: 
   - ดึงข้อมูลไพ่จาก DB (`Card` table).
   - ใช้ AI เลือกไพ่ (3 หรือ 5 ใบ).
   - สร้างคำทำนาย (Reading) ตาม Persona "แม่หมอมีมี่".
5. **Finalization**: บันทึกผลลัพธ์ลง DB และเปลี่ยนสถานะเป็น `COMPLETED`.

### 2.3 AI Agents & Prompts
- **Gatekeeper**: เน้นความปลอดภัยและขอบเขตของคำถาม.
- **Analyst**: สกัดเอา "แก่น" ของคำถามเพื่อส่งต่อให้ Mystic.
- **Mystic**: ใช้ System Prompt ที่กำหนด Persona ชัดเจน (อบอุ่น, แม่นยำ) และรองรับการอ่านไพ่ 78 ใบ (Major/Minor Arcana).

## 3. Database Schema (Prisma)
- **`Card`**: เก็บ Metadata ของไพ่ทาโรต์ (cardId, name, displayName, arcana, keywords, meanings, imageUrl).
- **`Prediction`**: เก็บข้อมูลการทำนาย (jobId, userIdentifier, question, status, analysisResult, selectedCards, finalReading).

## 4. Frontend Implementation
- **Home (`/`)**: รับ Input คำถาม, จัดการการส่งข้อมูลเบื้องต้น.
- **Submitted (`/submitted`)**: หน้าจอรอผล (Waiting Room) ที่มี Polling ทุก 5 วินาที และมีกิมมิค "Mimi Loading Avatar" และ "Fun Facts".
- **History (`/history`)**: แสดงรายการคำถามที่เคยถาม พร้อมระบบ Polling สำหรับงานที่ยังไม่เสร็จ.

## 5. Observations & Potential Risks
- **JSON Parsing**: การรับ JSON จาก AI (Gemini) อาจมีปัญหาเรื่อง Markdown formatting (```json ... ```) ซึ่งต้องใช้ `parseAIResponse` ที่แข็งแรง.
- **Polling Efficiency**: การ Polling ทุก 5 วินาทีในหน้า Submitted และ History อาจสร้าง Load ให้ DB ถ้ามี User จำนวนมาก (ควรพิจารณา Webhooks หรือ Optimized Polling ในอนาคต).
- **3D Assets**: มีการเตรียม Three.js ไว้ แต่ยังไม่เห็นการใช้งานที่ชัดเจนในหน้าหลัก (อาจเป็น Phase ถัดไป).

## 6. Next Steps Alignment
- ตรวจสอบความแข็งแรงของ `lib/ai/utils/json-parser.ts`.
- พัฒนาส่วนของ 3D หรือ UI Animation เพิ่มเติมตามที่เตรียมไว้ใน `package.json`.
- ปรับปรุงระบบ Error Handling ใน Workflow ให้ครอบคลุมกรณี AI Timeout หรือ API Error.

---
**Oracle Note**: ข้อมูลนี้ถูกบันทึกเพื่อเป็นฐานความรู้ (External Brain) สำหรับการทำงานในก้าวต่อไป ทุกการตัดสินใจจะอ้างอิงจากโครงสร้างนี้เป็นหลัก
