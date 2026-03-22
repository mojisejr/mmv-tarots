# Snapshot: Transaction History Implementation Plan (mmv-tarots)

**Date**: 2025-12-24 13:36 GMT+7
**Project**: mmv-tarots
**Status**: Planning
**Issue**: #none

## Overview
แผนการ Implement ระบบ Transaction History เพื่อสร้างความโปร่งใสในการใช้ Star และรองรับการ Refund กรณี Agentic LLM ทำงานผิดพลาด โดยเน้นความปลอดภัยของข้อมูลเดิม (Migration Safety)

---

## Phase 1: Schema Design & Safe Migration
**เป้าหมาย**: เพิ่มตารางบันทึกประวัติโดยไม่ทำให้ข้อมูล User หรือ Stars เดิมหาย

1. **Schema Definition**:
   - เพิ่ม `model CreditTransaction`
   - เพิ่ม `enum TransactionType` (TOPUP, PREDICTION, REFUND)
   - เพิ่ม `enum TransactionStatus` (SUCCESS, FAILED)
2. **Migration Strategy (Safety First)**:
   - ใช้คำสั่ง `npx prisma migrate dev --create-only` เพื่อสร้างไฟล์ SQL มาตรวจสอบก่อน
   - **Checklist**: ต้องไม่มีคำสั่ง `DROP TABLE`, `TRUNCATE` หรือ `ALTER TABLE` ที่ลบข้อมูลในตาราง `User`, `Card`, หรือ `Prediction`
   - หาก Prisma แจ้งว่าจะต้อง Reset ให้หยุดและตรวจสอบว่ามีฟิลด์ไหนที่ขัดแย้ง (เช่น Required field ที่ไม่มี default)

## Phase 2: Atomic Service Logic
**เป้าหมาย**: ทำให้การขยับยอดเงินและการบันทึกประวัติเกิดขึ้นพร้อมกันเสมอ

1. **CreditService Upgrade**:
   - ปรับปรุง `deductStar` และ `addStars` ให้ใช้ `prisma.$transaction`
   - ทุกการเปลี่ยนแปลงต้องสร้าง `CreditTransaction` record ควบคู่กัน
   - บันทึก `balanceAfter` เพื่อใช้เป็น Snapshot สำหรับการ Audit
2. **Validation**:
   - ตรวจสอบยอดเงินก่อนทำรายการเสมอ (Double-check)

## Phase 3: Workflow Integration & Refund Logic
**เป้าหมาย**: เชื่อมต่อกับ Agent และรองรับกรณีผิดพลาด

1. **TarotService Hook**:
   - เรียก `deductStar` เมื่อ Agent ส่งสถานะ `COMPLETED`
   - ส่ง `predictionId` เข้าไปใน `metadata` ของ Transaction เพื่อการตรวจสอบย้อนกลับ
2. **Refund Mechanism**:
   - สร้างฟังก์ชัน `refundStar` ใน `CreditService`
   - หาก Workflow ตัดแต้มไปแล้วแต่เกิด Error ในขั้นตอนสุดท้าย (เช่น การบันทึกผลลง DB พลาด) ให้ระบบเรียก Refund อัตโนมัติ

## Phase 4: API & MimiVibe UI
**เป้าหมาย**: แสดงผลประวัติให้ User เห็นอย่างสวยงาม

1. **API Route**:
   - `GET /api/credits/history`: ดึงประวัติย้อนหลัง (รองรับ Pagination)
2. **UI Components**:
   - `TransactionHistoryList`: ใช้ `GlassCard` แสดงรายการ
   - `StatusBadge`: แสดงสีตามประเภท (Green: Topup, Red: Usage, Blue: Refund)
   - เพิ่ม Link "View History" ในหน้า Profile

---

## Migration Safety Note
- **Data Loss Prevention**: เนื่องจากเราเพิ่งรัน `import-cards.ts` ไป ข้อมูลไพ่ 78 ใบมีความสำคัญมาก หากการ Migrate ครั้งนี้บังคับ Reset เราต้องรัน Script นำเข้าไพ่ซ้ำทันที
- **Backup**: แนะนำให้รัน `pg_dump` (ถ้าเป็นไปได้) หรือ Export ตาราง User/Stars ไว้ก่อนรัน Migration จริง

---
**Oracle Keeper**: แผนนี้ถูกออกแบบมาเพื่อรองรับการขยายตัวสู่ระบบ "เหรียญรอง" ในอนาคต โดยใช้โครงสร้าง Ledger เดียวกัน
