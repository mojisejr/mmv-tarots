# Snapshot: Burst & Breathe Blueprint (mmv-tarots)

**Time**: 2026-01-08 22:45
**Context**: Designing a more human-centric cooldown system for the tarot app to support "Continuous Questioning" (ขยี้ดวง) similar to live stream fortune telling.

## The Problem
The current 120-second fixed delay between questions is too rigid. It breaks the flow of users who want to ask follow-up questions (3 questions per topic is the common pattern).

## The "Burst & Breathe" Solution
Move from a fixed delay to a "Token Bucket" inspired approach with 3 slots.

### 1. Specification
- **Burst Capacity**: 3 Questions.
- **Breathe Delay**: 30 Seconds (Enforced only after 3rd consecutive question).
- **Refill Rate**: 1 slot per 60 seconds (Natural flow doesn't trigger UI cooldown).

### 2. Implementation Plan

#### Phase 1: Backend Intelligence (No Schema Change)
- **Refactor `PredictionService`**: เพิ่ม Helper method สำหรับดึงประวัติการนับ Burst โดยไม่ต้องเพิ่มฟิลด์ใน DB
- **API `/api/predict`**: 
    - ดึง 3 `predictions` ล่าสุด
    - Logic: หาก 3 รายการล่าสุดเกิดในช่วงเวลา < 3 นาที และรายการล่าสุดห่างจาก `now` < 30 วินาที -> **ติด Cooldown**
- **API `/api/user/me` (Crucial Update)**:
    - ปรับจากการส่ง `lastPredictionAt` อย่างเดียว เป็นการส่ง `concentration { active: number, total: 3, nextRefillIn: number }`
    - ทำให้ Frontend รู้ทันทีว่ามี 🔮 เหลือเท่าไหร่โดยไม่ต้องคำนวณซ้ำซ้อน

#### Phase 2: Frontend UX Soul (Revision)
- **Navigation Provider Sync**: ปรับให้เก็บสถานะ `concentration` จาก API `user/me`
- **Quota Indicator (`QuestionInput`):**
    - ใช้ `FloatingBadge` ตำแหน่ง `bottom-left`
    - แสดงผลเป็นไอคอน 🔮 (3 ดวง) อิงตาม `concentration.active`
- **Mystic Messaging:**
    - แสดงข้อความรวบรวมสมาธิตาม `concentration.nextRefillIn`

#### Phase 4: Integration with Star System
- Ensure "Burst" questioning still consumes stars per question.
- No free bursts; the system only controls the *timing*, not the *cost*.

## Technical Audit (Frontend)
- **Component Found**: `projects/mmv-tarots/components/ui/question-input.tsx`
- **Current State**: มีระบบ Cooldown พื้นฐานแบบ Fixed 120s และแสดงเวลาในปุ่ม
- **Refactor Point**: เปลี่ยนจากการรับ `cooldownRemaining` อย่างเดียว เป็นการรับ `quotaRemaining` และ `statusMessage` จาก `app/page.tsx` หรือ `NavigationProvider`

## Expected Outcome
- **User Satisfaction**: Users can ask follow-up questions immediately.
- **System Safety**: 100 users/hour (as per human requirement) will generate ~400-500 AI calls/hour (assuming 5 questions/user). This is well within Gemini Paid Tier limits.

## Tags
`ux-improvement` `burst-and-breathe` `mmv-tarots` `rate-limiting` `blueprint`
