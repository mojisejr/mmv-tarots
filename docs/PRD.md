นี่คือไฟล์ prd.md ฉบับปรับปรุงใหม่ทั้งหมด (Rewritten) ให้สอดคล้องกับ Tech Stack ที่เราสรุปกัน (Next.js + Vercel Workflow + AI Gateway + Neon DB) เพื่อให้เหมาะกับ Solo Developer โดยตัดส่วนของ Rust และ Worker Server ที่ซับซ้อนออกไปครับ
คุณสามารถนำเนื้อหานี้ไปแทนที่ไฟล์เดิมได้ทันทีครับ
--------------------------------------------------------------------------------
Product Requirements Document (PRD)
MimiVibe - Tarot Reading Application (Serverless Edition)
1. Project Overview (ภาพรวมโครงการ)
MimiVibe คือแอปพลิเคชันดูดวงไพ่ทาโร่ "แม่หมอมีมี่" ที่เน้นประสบการณ์การใช้งานที่ลื่นไหลและการทำนายที่แม่นยำเสมือนคนจริง ระบบถูกออกแบบใหม่ในรูปแบบ Serverless Architecture ทั้งหมด เพื่อรองรับการทำงานแบบ Asynchronous (ไม่ต้องรอหน้าจอ) และลดภาระการดูแลรักษา Server สำหรับนักพัฒนาคนเดียว (Solo Dev)
เป้าหมายหลัก:
• รองรับการประมวลผล Agent Pipeline ที่ใช้เวลานาน (> 1 นาที) ได้อย่างเสถียร
• ระบบ Auto-scale รองรับผู้ใช้งานพร้อมกัน 100+ คนโดยไม่ต้องจูน Server
• ใช้ภาษาเดียว (TypeScript) ตลอดทั้ง Stack (Frontend & Backend)
--------------------------------------------------------------------------------
2. Technical Stack (The "Solo-Dev" Stack)
เปลี่ยนจากสถาปัตยกรรม Microservices (Rust/Worker) มาเป็น Next.js Ecosystem บน Vercel:
• Frontend & API: Next.js (App Router)
• Orchestrator: Vercel Workflow (ทำหน้าที่แทน Queue Worker และ Redis Streams)
• AI Engine: Vercel AI Gateway + AI SDK
• Database: Neon (PostgreSQL) สำหรับเก็บข้อมูล User และ History (Vercel Managed Integration)
• Language: TypeScript (Strict Mode)
--------------------------------------------------------------------------------
3. System Workflow (การทำงานของระบบ)
ระบบทำงานแบบ "Fire-and-Forget" เพื่อแก้ปัญหา Browser Timeout:
1. Submission: User ส่งคำถามผ่านหน้าเว็บ -> API รับเรื่อง -> สร้าง Job ID -> ส่งคืน User ทันที
2. Background Process: Vercel Workflow รับช่วงต่อ รัน Pipeline 3 Agents เบื้องหลัง (โดย User ไม่ต้องเปิดหน้าจอค้างไว้)
3. Completion: เมื่อเสร็จสิ้น Workflow จะบันทึกผลลง Neon Database
4. Retrieval: User กลับมาเช็คผล (Polling) ผ่านหน้าประวัติหรือหน้าผลลัพธ์
--------------------------------------------------------------------------------
4. Agent Pipeline Specifications
Process ทั้งหมดรันอยู่ภายใต้ Vercel Workflow (app/workflows/tarot.ts) โดยแบ่งเป็นขั้นตอนดังนี้:
Step 1: The Gatekeeper (Question Filter)
• หน้าที่: ตรวจสอบความเหมาะสมของคำถาม
• Tech: Vercel AI SDK call to google-gemini-flash via AI Gateway
• Criteria:
    ◦ ความยาว: 8 - 180 ตัวอักษร
    ◦ หัวข้อที่ห้าม: การเมืองรุนแรง, สิ่งผิดกฎหมาย, การแพทย์เฉพาะทาง, คำหยาบคาย
• Output: boolean (ผ่าน/ไม่ผ่าน)
Step 2: The Analyst (Context Analysis)
• หน้าที่: วิเคราะห์เจตนาและอารมณ์ของผู้ถาม
• Tech: google-gemini-flash via AI Gateway
• Output JSON:
    ◦ mood: อารมณ์ (เช่น กังวล, มีความหวัง, เศร้า)
    ◦ topic: หัวข้อ (การงาน, ความรัก, การเงิน)
    ◦ period: กรอบเวลาที่ถามถึง
Step 3: The Dealer (Card Selection)
• หน้าที่: สุ่มไพ่ (Native Logic)
• Tech: TypeScript Function (ไม่ใช้ AI เพื่อความ Random แท้จริง)
• Logic:
    ◦ สุ่มจำนวนไพ่: 3 หรือ 5 ใบ (โอกาส 50/50)
    ◦ สุ่มหน้าไพ่: จากสำรับ Rider-Waite 78 ใบ
• Output: Array ของ Card Objects (ID, Name, ImageURL, Meaning)
Step 4: The Mystic (Reading Agent - Main)
• หน้าที่: "แม่หมอมีมี่" ทำนายดวง
• Tech: google-gemini-pro หรือ gpt-4o (เน้นฉลาดและละเอียด)
• Constraints:
    ◦ Timeout: Workflow รองรับการรอนานได้ (Long-running)
    ◦ Persona: อบอุ่น, เป็นกันเอง, แม่นยำ, ฟันธงชัดเจน
• Input Context: คำถามเดิม + ผลวิเคราะห์ (Step 2) + หน้าไพ่ที่ได้ (Step 3)
--------------------------------------------------------------------------------
5. Data Structures (Database Schema)
ใช้ Neon (PostgreSQL) ตารางเดียวเพื่อความคล่องตัว:
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Link กับ User (ถ้ามี Login) หรือเก็บ Device ID
  user_identifier TEXT, 
  
  question TEXT NOT NULL,
  
  -- Workflow Status tracking
  job_id TEXT, -- ID อ้างอิงจาก Vercel Workflow
  status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
  
  -- เก็บผลลัพธ์แบบ JSONB เพื่อความยืดหยุ่น
  analysis_result JSONB,
  selected_cards JSONB,
  final_reading JSONB, -- ผลทำนายสุดท้าย
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
--------------------------------------------------------------------------------
6. Response Format (JSON Structure)
โครงสร้าง JSON สุดท้ายที่ Frontend จะนำไปแสดงผล (Output จาก Step 4):
{
  "header": "สวัสดีค่า... (ทักทายตาม Mood ของคำถาม)",
  "cards_reading": [
    {
      "position": 1,
      "name_en": "The Sun",
      "name_th": "ไพ่พระอาทิตย์",
      "image": "cards/major/19.jpg",
      "keywords": ["ความสำเร็จ", "ความสุข"],
      "interpretation": "ความหมายไพ่ใบนี้ในบริบทคำถาม..."
    }
    // ... (3 หรือ 5 ใบ)
  ],
  "reading": "คำทำนายหลักแบบฟันธง... (เนื้อหาหลัก)",
  "suggestions": [
    "คำแนะนำที่ 1",
    "คำแนะนำที่ 2"
  ],
  "next_questions": [
    "คำถามแนะนำที่ 1",
    "คำถามแนะนำที่ 2"
  ],
  "final_summary": "สรุปสั้นๆ 1 ประโยค",
  "disclaimer": "โปรดใช้วิจารณญาณในการอ่านนะคะ"
}
--------------------------------------------------------------------------------
7. API Endpoints Specification
7.1 Submit Question
• Endpoint: POST /api/predict
• Body: { "question": "..." }
• Process:
    1. Validate input เบื้องต้น
    2. Insert ลง Neon Database (Status: PENDING)
    3. Call triggerWorkflow (Vercel SDK)
• Response: { "jobId": "xyz-123", "status": "PENDING" }
7.2 Check Status (Polling)
• Endpoint: GET /api/predict/[jobId]
• Process: Query Neon Database by jobId
• Response (Pending): { "status": "PROCESSING" }
• Response (Done): { "status": "COMPLETED", "data": { ...Response Format JSON... } }
--------------------------------------------------------------------------------
8. Deployment Strategy & Cost Control
Deployment
• Repo Structure: Monorepo (Next.js default)
• Platform: Vercel (Hobby or Pro Plan)
• Environment Variables:
    ◦ GOOGLE_GENERATIVE_AI_API_KEY: สำหรับ Gemini
    ◦ NEON_DATABASE_URL: สำหรับ Database (จะถูก setup ผ่าน Vercel Managed Integration)
    ◦ AI_GATEWAY_SECRET: (Optional) สำหรับ Secure Gateway
Cost & Limits Management
• Vercel Workflow: ใช้โควต้าตาม Plan (Beta มักจะฟรีหรือมี limit สูง)
• AI Spend: ควบคุมผ่าน Vercel AI Gateway
    ◦ เปิด Caching: ถ้าถามคำถามเดิมเป๊ะๆ ให้ตอบ Cache เดิม (ประหยัดเงิน)
    ◦ Rate Limiting: จำกัด 10 คำถาม/วัน ต่อ User (ใช้ Upstash Redis หรือเช็ค DB ก็ได้)
--------------------------------------------------------------------------------
Version: 2.1 (Neon Integration) Date: 2025-12-08