# Snapshot: Git Workflow Refinement Plan
**Date**: 2026-01-05 13:30
**Project**: oracle-framework / mmv-tarots
**Issue ID**: #none

## Context
ผู้ใช้ต้องการปรับปรุง Git Workflow ให้มีความเป็นระเบียบและปลอดภัยมากขึ้น โดยเน้นการใช้ `staging` branch เป็นฐานหลักในการพัฒนา (Source of Truth for Development) แทนการใช้ `main` หรือ `copiloting` โดยตรง

## Proposed Workflow (The "Staging-First" Loop)
1.  **Branching Strategy**:
    *   **Base**: `staging` branch เท่านั้น
    *   **Feature**: สร้างจาก `staging` โดยใช้ pattern `<type>/<name>` (เช่น `feat/ui-refinement`, `fix/centering-issue`)
    *   **Strict Rule**: ห้ามสร้าง Branch ซ้อน Branch (No nested feature branches)
2.  **Safety Check (Stop & Warn)**:
    *   ก่อนเริ่มงาน AI ต้องเช็คว่าอยู่ที่ `staging` หรือไม่
    *   ถ้าไม่อยู่ที่ `staging` **ต้องหยุดและเตือนมนุษย์ทันที** และรอคำสั่งเท่านั้น ห้ามดำเนินการใดๆ ต่อเอง
3.  **Development Loop**:
    *   ทำงานบน Feature Branch จนเสร็จ
    *   เมื่อเสร็จสิ้น แจ้งให้ผู้ใช้ทราบ
4.  **Integration (Local)**:
    *   ผู้ใช้จะเป็นคนสั่งให้ `merge` Feature Branch เข้าสู่ `staging` บนเครื่อง Local เอง
    *   Push `staging` ขึ้น Remote Repo
5.  **Release (Remote)**:
    *   เมื่อ Test บน `staging` (Remote) ผ่านแล้ว AI จะเป็นคนสร้าง **Pull Request (PR)** จาก `staging` เข้าสู่ `main`
    *   ผู้ใช้จะเป็นคน Review และ Merge PR ด้วยตัวเอง

## Implementation Plan
1.  **Update `.claude/commands/impl.md`**:
    *   เพิ่มขั้นตอนการตรวจสอบ Branch ก่อนเริ่มงาน (Phase 1)
    *   เพิ่มกฎการสร้าง Branch ตาม Pattern ที่กำหนด (Phase 2)
    *   ปรับปรุงขั้นตอนการส่งมอบงาน (Phase 4) ให้สอดคล้องกับการ Merge เข้า Staging
2.  **Update `.github/copilot-instructions.md`**:
    *   เพิ่ม "Golden Rules" ใหม่เรื่อง Git Workflow
    *   บังคับใช้ Pattern การตั้งชื่อ Branch
3.  **Verification**:
    *   ทดสอบสร้าง Branch ใหม่ใน `projects/mmv-tarots` ตามกฎใหม่

## Expected Outcome
*   ลดความเสี่ยงในการทำ `main` พัง
*   มีประวัติการพัฒนาที่ชัดเจน (Traceability) ผ่าน `staging` branch
*   ผู้ใช้มีอำนาจในการ Review สูงสุดก่อนโค้ดจะเข้าสู่ Production
