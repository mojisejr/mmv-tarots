---
project: mmv-tarots
issue: #none
tags: []
date: 2025-12-20
agent: oracle-keeper
---

# Snapshot: mmv-tarots Milestone Planning (User Auth & Profile)
**Date**: 2025-12-20
**Time**: 14:50
**Issue**: #none
**Model**: Gemini 3 Flash (Free Tier)

## Context
มนุษย์กำหนดทิศทางสำหรับ Milestone ถัดไปของ `mmv-tarots` คือการเพิ่มระบบ User Authentication และหน้า Profile

## Observations
- **Auth Framework**: ตัดสินใจใช้ **Better Auth** ร่วมกับ **Line Login** เท่านั้น
- **Database**: ใช้ Prisma Adapter สำหรับ Better Auth และจะใช้ตารางมาตรฐานของ Better Auth
- **User Data**: เก็บ `displayName` และ `displayPicture` จาก Line
- **MVP Features**: เพิ่มระบบสะสมแต้ม (Points) และ Referral Link
- **UI/UX**: เลือกใช้หน้า Profile แยกต่างหาก (`/profile`) แทน Modal เพื่อความ Clean และ Scalability โดยยังคง Theme Glassmorphism

## Decisions
- เตรียมอัปเดต `schema.prisma` เพื่อรองรับ Better Auth และฟิลด์ `points`, `referralCode`
- วางแผนสร้างหน้า `/profile` ที่มี Section สำหรับ Points และ Referral Mockup
- เตรียม Refactor `MainNavigation` และ `NavigationProvider` เพื่อรองรับสถานะ Login จริงจาก Better Auth

## Tools Used
- `run_in_terminal` (date)
- `read_file` (navigation components)
- `create_file` (snapshot log)
