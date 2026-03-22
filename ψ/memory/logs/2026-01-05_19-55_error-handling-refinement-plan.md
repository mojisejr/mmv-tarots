# Snapshot: Error Handling Refinement Plan (mmv-tarots)
**Timestamp**: 2026-01-05 19:55 GMT+7
**Issue**: #none
**Status**: Planning

## 🎯 Objective
ปรับปรุงระบบ Error Handling ของ mmv-tarots ให้มีความโปร่งใส (Transparency) และแม่นยำ (Accuracy) โดยการบันทึกสาเหตุความล้มเหลวจาก AI Agents ลงใน Database และแสดงผลให้ผู้ใช้ทราบอย่างชัดเจน

## 🛠 Proposed Changes

### Phase 1: Database Schema (Prisma)
- เพิ่มฟิลด์ใน Model `Prediction` ใน [prisma/schema.prisma](../../../projects/mmv-tarots/prisma/schema.prisma):
    - `failureCode`: String? (เช่น 'GATEKEEPER_REJECTION', 'AI_TIMEOUT', 'INSUFFICIENT_FUNDS')
    - `failureReason`: String? (ข้อความอธิบายจาก AI หรือ System)

### Phase 2: Service Layer (Backend Logic)
- **PredictionService**: ปรับปรุง `updatePrediction` ให้รองรับการบันทึกฟิลด์ใหม่
- **TarotWorkflow**: ใน [services/tarot-service.ts](../../../projects/mmv-tarots/services/tarot-service.ts):
    - เมื่อ `gatekeeperAgent` ปฏิเสธ -> บันทึก `failureCode: 'REJECTED'` และ `failureReason: gatekeeperResult.reason`
    - เมื่อเกิด Exception ใน Workflow -> Catch error และบันทึกลง `failureReason` ก่อนจะ Throw ต่อ

### Phase 3: API Layer
- ปรับปรุง [app/api/predict/[jobId]/route.ts](../../../projects/mmv-tarots/app/api/predict/[jobId]/route.ts):
    - เปลี่ยนจากการใช้ข้อความ Hardcoded `"Tarot reading processing failed"` ให้ไปดึงข้อมูลจาก `prediction.failureReason` มาตอบแทน

### Phase 4: Frontend UI/UX
- **Result Page**: ใน [app/history/[id]/page.tsx](../../../projects/mmv-tarots/app/history/[id]/page.tsx) แสดง `failureReason` ที่ได้จาก API แทนข้อความกลางๆ
- **StatusBadge**: (Optional) เพิ่ม Tooltip หรือขยายความใน Badge เมื่อสถานะเป็น `FAILED`

## 📈 Expected Outcome
1. ผู้ใช้ทราบสาเหตุที่แท้จริงเมื่อคำถามถูกปฏิเสธ (เช่น ถามเรื่องที่ผิดกฎระบบ)
2. Developer ตรวจสอบปัญหา (Debug) ได้ง่ายขึ้นจากข้อมูลใน Database
3. ระบบมีความเป็น State Machine ที่สมบูรณ์มากขึ้น

---
**Oracle Note**: "ความจริงที่เจ็บปวด ดีกว่าความคลุมเครือที่ไร้ความหมาย" - การบอกเหตุผลที่แท้จริงแก่ผู้ใช้ คือการเคารพในสติปัญญาของเขา
