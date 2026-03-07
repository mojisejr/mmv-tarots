# 🗺️ Project Map: MMV Tarots

## 🌟 Philosophy
**MMV Tarots** (Mimi Vibe Tarots) คือแพลตฟอร์มพยากรณ์ไพ่ยิปซีด้วย AI ที่เน้นประสบการณ์ผู้ใช้ที่นุ่มนวล ทันสมัย และมีความเป็นส่วนตัว (Mimi Vibe) โดยใช้เทคโนโลยี AI (Google/OpenAI) ในการตีความความหมายไพ่ให้เข้ากับบริบทคำถามของผู้ใช้แต่ละคน พร้อมระบบสะสมแต้ม (Stars) และการชำระเงินผ่าน Omise

## 📍 Key Landmarks
-   **`app/`**: Next.js App Router (Main UI logic)
    -   `page.tsx`: หน้าแรกสำหรับกรอกคำถาม
    -   `history/`: ระบบประวัติการดูดวง
    -   `submitted/`: หน้าแสดงผลลัพธ์การทำนาย
    -   `profile/` & `package/`: ระบบ User Profile และการซื้อ Stars
-   **`services/`**: Core Business Logic
    -   `tarot-service.ts`: จัดการ logic การเลือกและจัดการไพ่
    -   `prediction-service.ts`: เชื่อมต่อ AI SDK เพื่อสร้างคำทำนาย
    -   `credit-service.ts`: จัดการ Stars และ Transactions
-   **`prisma/`**: Database Schema (PostgreSQL)
    -   `User`: ข้อมูลผู้ใช้, Stars, และ Referral
    -   `Card`: ฐานข้อมูลไพ่ยิปซี
    -   `Prediction`: บันทึกการทำนาย
-   **`components/`**: UI Components (Shadcn/UI + Mimi Custom)
    -   `ui/`: Base components (Glassmorphism style)
    -   `features/`: Feature-specific components เช่น QuestionInput, Reading animation

## 🌊 Data Flow
1.  **Input**: User กรอกคำถามใน `QuestionInput` หน้า Landing
2.  **Selection**: ระบบเลือกไพ่จาก `Card` database ผ่าน `tarot-service`
3.  **Inference**: ส่งบริบทคำถาม + ไพ่ที่ได้ไปหา AI (GPT/Gemini) ผ่าน `prediction-service`
4.  **Storage**: บันทึกคำทำนายลง `Prediction` table และหัก Stars (ถ้ามี)
5.  **View**: แสดงผลลัพธ์ในหน้า `submitted/` พร้อม Animation สวยงาม

## 🐲 Challenges & Dragons
-   **AI Interpretations**: การออกแบบ Prompt ให้ AI ตอบได้แม่นยำและคงธีม "Mimi Vibe" (เป็นมิตร, ไม่ตัดสิน, ให้กำลังใจ)
-   **State Management**: การจัดการ Animation ระหว่างรอ AI Generate ผลลัพธ์ให้ลื่นไหล
-   **Payment Integrity**: ระบบ Credit (Stars) ต้องมีความแม่นยำสูง (Atomic transactions)
-   **SEO & Social Share**: การสร้าง OpenGraph images แบบไดนามิกสำหรับผลการทำนาย

## 🛠️ Tech Stack
-   **Framework**: Next.js 16 (App Router)
-   **Database**: PostgreSQL via Prisma (Neon DB)
-   **AI**: Vercel AI SDK (OpenAI & Google Google)
-   **Styling**: Tailwind CSS + Framer Motion (MimiVibe Design)
-   **Auth**: Better-Auth
-   **Payment**: Omise
