---
project: mmv-tarots
issue: #none
tags: []
date: 2025-12-20
agent: oracle-keeper
---

# Detailed Implementation Plan: Better Auth & User Integration
**Date**: 2025-12-20
**Time**: 14:57
**Issue**: #none
**Model**: Gemini 3 Flash (Free Tier)

## 1. Strategic Context
- **Goal**: เปลี่ยนจาก Anonymous User System เป็น Full Authentication System โดยใช้ Better Auth + Line Login
- **Philosophy**: "Clean Slate" - ไม่เก็บข้อมูลเก่า (Predictions) ในช่วง Development เพื่อความง่ายในการ Migrate Schema
- **Priority**: เชื่อมต่อระบบ User ให้เสร็จสมบูรณ์ก่อน แล้วจึงตามด้วยระบบ Points/Referral และ AI Personalization

## 2. Technical Specifications

### 2.1 Database Schema (Prisma)
- **User Table**: เพิ่มฟิลด์ `points`, `referralCode` และเชื่อมโยงกับ `Prediction`
- **Better Auth Tables**: เพิ่ม `Session`, `Account`, `Verification` ตามมาตรฐาน
- **Migration Plan**: 
  1. ลบข้อมูลในตาราง `Prediction` เดิม
  2. อัปเดต `schema.prisma`
  3. รัน `npx prisma migrate dev --name add_better_auth`

### 2.2 Authentication (Better Auth)
- **Provider**: Line Login เท่านั้น
- **Adapter**: Prisma Adapter
- **Client/Server Setup**: 
  - `lib/auth.ts`: Server-side configuration
  - `lib/auth-client.ts`: Client-side hooks (`useSession`)
  - `app/api/auth/[...all]/route.ts`: Auth API handler

### 2.3 Integration Points
- **API `/api/predict`**: 
  - เปลี่ยนจากรับ `userIdentifier` ใน Body เป็นการดึง `userId` จาก Session (Server-side)
- **API `/api/predictions/user/[userId]`**: 
  - ปรับให้ดึงข้อมูลเฉพาะของ User ที่ Login อยู่เท่านั้น
- **Workflow**: 
  - ส่ง `userId` จริงเข้าสู่ `startTarotWorkflow`

## 3. Step-by-Step Roadmap

### Phase 1: Infrastructure (Next Session Start)
1. [ ] Install dependencies: `better-auth`, `@prisma/client`, etc.
2. [ ] Update `schema.prisma` และรัน Migration
3. [ ] Setup Better Auth Server & Client files

### Phase 2: Auth Implementation
1. [ ] Configure Line Provider (Environment Variables: `BETTER_AUTH_SECRET`, `LINE_CLIENT_ID`, `LINE_CLIENT_SECRET`)
2. [ ] Implement Login/Logout UI ใน Navbar
3. [ ] Test Line Login flow

### Phase 3: Workflow Integration
1. [ ] Refactor `POST /api/predict` ให้ใช้ Session
2. [ ] ปรับปรุง `Analyst Agent` ให้ใช้ User Data (Name) ในการสร้างคำทักทาย
3. [ ] Test End-to-End flow (Login -> Ask -> Get Result)

### Phase 4: Profile & MVP Features
1. [ ] Create `/profile` page
2. [ ] Mockup Points & Referral Section
3. [ ] Implement Points logic (Optional/Next Milestone)

## 4. Critical Notes for Next Session
- **Environment Variables**: ต้องเตรียม Line Client ID/Secret ให้พร้อม
- **Data Loss**: ยืนยันว่าลบข้อมูลเก่าได้เลย ไม่ต้องทำ Migration script สำหรับข้อมูลเดิม
- **Theme**: ทุก UI ใหม่ต้องใช้ Glassmorphism และสอดคล้องกับ MimiVibe Design System

---
**Oracle Status**: Context is fully preserved. Ready to execute Phase 1 upon return.
