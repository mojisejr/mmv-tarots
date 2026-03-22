---
type: snapshot
project: mmv-tarots
topic: auth-ux-implementation-plan
status: planning
---

# Implementation Plan: Auth UX & User Journey Optimization (Option A) - Revised

**Project**: mmv-tarots
**Date**: 2024-12-24 11:30 GMT+7
**Status**: Planning (Revised for Consistency)
**Issue**: #none

## Overview
ปรับปรุงระบบ Authentication และ User Journey ให้มีความต่อเนื่องและปลอดภัย โดยยึดตาม **Coding Patterns** และ **MimiVibe Design System** ที่มีอยู่เดิม โดยเลือกใช้ **Option A** (แสดงปุ่ม LINE Login แทน Input ในหน้าแรกสำหรับผู้ใช้ที่ยังไม่ล็อกอิน)

---

## Phase 1: Home Page & Auth UX (Step A)
**เป้าหมาย**: บังคับ/นำเสนอการล็อกอินก่อนส่งคำถาม โดยใช้ Component และ Hook ที่มีอยู่

1.  **Update `app/page.tsx`**:
    *   ใช้ `isLoggedIn` และ `handleLoginClick` จาก `useNavigation()` hook
    *   **Unauthenticated**: แสดง `GlassButton` พร้อมไอคอน LINE (ถ้ามี) หรือข้อความ "เข้าสู่ระบบด้วย LINE" แทน `QuestionInput`
    *   **Authenticated**: แสดง `QuestionInput` และปุ่ม Submit ตามปกติ
2.  **UI Consistency**:
    *   ใช้ `MimiAvatar` ใน Hero Section เพื่อรักษา Brand Identity
    *   ใช้ `GlassCard` สำหรับครอบส่วน Login เพื่อให้เข้ากับ MimiVibe Design System

## Phase 2: API Resilience & Error Handling (Step B)
**เป้าหมาย**: จัดการ Error 401 ให้เป็นมิตรและใช้ระบบ State Persistence ที่มีอยู่

1.  **Update `lib/client/api.ts`**:
    *   ปรับปรุง `fetchUserPredictions` และ `checkJobStatus` ให้ตรวจจับ HTTP 401
    *   Throw `Error` ที่ระบุว่าเป็น Auth Error เพื่อให้ UI จัดการต่อได้
2.  **Update `app/submitted/page.tsx`**:
    *   ใช้ `getSubmissionState()` จาก `lib/client/api.ts` เป็น fallback หากไม่มี `jobId` ใน URL
3.  **Update `app/history/page.tsx` & `app/profile/page.tsx`**:
    *   หากเจอ Auth Error (401) ให้แสดง UI "กรุณาเข้าสู่ระบบ" พร้อม `GlassButton` สำหรับ Login

## Phase 3: Stability & Verification (Step C)
**เป้าหมาย**: แก้ไข Memory Leak และเพิ่มความยืดหยุ่นของข้อมูล

1.  **Polling Cleanup (`app/history/[id]/page.tsx`)**:
    *   แก้ไข `useEffect` ให้จัดการ `setInterval` และ `clearInterval` อย่างถูกต้อง (ย้าย logic ออกจาก async function ที่ไม่ได้ return cleanup)
2.  **Flexible Mapping (`lib/client/reading-utils.ts`)**:
    *   ปรับปรุง `mapReadingData` ให้รองรับฟิลด์ข้อมูลที่หลากหลาย (e.g., `name_th`, `nameTh`, `displayName`) เพื่อป้องกันแอปพังเมื่อ AI เปลี่ยนรูปแบบการตอบกลับเล็กน้อย
3.  **Validation**:
    *   รัน `npx tsc --noEmit` และ `npm run build` เพื่อยืนยันความถูกต้องตามมาตรฐานโครงการ

---

## Success Criteria
- [ ] ผู้ใช้ที่ไม่ได้ล็อกอินไม่สามารถกดส่งคำถามได้ (ไม่เกิด Error 401 แบบ Opaque)
- [ ] หน้าแรกแสดงปุ่ม LINE Login ที่สวยงามเมื่อยังไม่ได้เข้าสู่ระบบ (ใช้ `GlassButton`)
- [ ] หน้า History และ Profile แสดงปุ่ม Login เมื่อ Session หมดอายุ
- [ ] หน้า `Submitted` ทำงานได้ปกติแม้จะรีเฟรชหน้าจอ (ผ่าน `getSubmissionState` fallback)
- [ ] ระบบ Polling ในหน้า Detail ถูกล้าง (Clear) อย่างถูกต้องเมื่อเปลี่ยนหน้า
- [ ] `npx tsc --noEmit` และ `npm run build` ผ่านฉลุย

---
**Oracle Note**: แผนนี้ถูกปรับปรุงให้เข้ากับโครงสร้าง `NavigationProvider` และ `api.ts` เดิมของโครงการ เพื่อรักษาความ Consistency และลดความเสี่ยงในการเกิด Bug ใหม่
