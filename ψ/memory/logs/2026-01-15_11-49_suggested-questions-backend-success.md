# Snapshot: Suggested Question Backend & API (v1.1)

**Time**: 2026-01-15 11:49
**Context**: เสร็จสิ้นการ Implement Backend Phase 1 (Database) และ Phase 2 (API) สำหรับระบบคำถามแนะนำ

## Technical Milestone
- **Database**:
    - เพิ่ม Model `SuggestedQuestion` ใน Prisma
    - Migration: `20260115043924_add_suggested_question_model`
- **Service Layer**:
    - สร้าง `SuggestedQuestionService` พร้อมฟังก์ชัน `seedDefaults()` (Auto-seed 10 คำถาม)
- **API Strategy**:
    - สร้าง Endpoint `GET /api/suggested-questions`
    - Caching: **Static (ISR) 1 Hour** (`revalidate = 3600`) ยืนยันจากการ Build Log

## Verify
- **Build Status**: ✅ PASSED (100%)
- **Static Generation**: ✅ `/api/suggested-questions` -> `○ (Static) 1h`

## Apply When
- เมื่อต้องการแก้ไขชุดคำถาม Default (แก้ใน `seedDefaults`)
- เมื่อต้องการตรวจสอบประสิทธิภาพของ Caching Strategy
- เมื่อต้องการเริ่มพัฒนา Frontend (Phase 3-4)

## Tags
`backend-success` `prisma-migration` `isr-caching` `mmv-tarots` `phase-1-complete`
