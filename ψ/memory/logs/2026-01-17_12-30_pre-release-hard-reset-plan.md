# Snapshot: Pre-Release Hard Reset Plan (Production Preparation)

**Time**: 2026-01-17 12:30 GMT+7
**Context**: เตรียมความพร้อมโค้งสุดท้ายก่อน Release โปรเจกต์ `mmv-tarots` โดยการล้างฐานข้อมูล Production (Clean Slate) เพื่อรองรับ Master Data ชุดจริง

## Insight: Strategy & Isolation

เพื่อให้การรันสคริปต์ทำลายล้างครั้งนี้สะอาดและปลอดภัยที่สุด เราใช้กลยุทธ์ **"Clean Swap & Isolation"**:

### 1. Environment Isolation
- ใช้ `.tmp/mmv/.env` เป็นแหล่งข้อมูลความลับสำหรับ Production (Main Database: `ep-dawn-sun...`)
- ปล่อย `.env` เดิมในโปรเจกต์ที่เป็น Staging ไว้เหมือนเดิม เพื่อป้องกัน Human Error ที่อาจจะไปแก้ไขไฟล์ผิดจุด
- ใช้ระบบ **Subshell Swap**: เปลี่ยนไฟล์ชั่วคราว รันสคริปต์ และคืนสภาพทันที

### 2. Data Hygiene Strategy
- **Wipe Policy**: ล้าง Users, Transactions, Predictions, และ History ทั้งหมด
- **Master Data**: Re-seed ไพ่ 78 ใบจาก `docs/card.csv` และแพ็กเกจราคาจาก `.tmp/master-seed-config.json`
- **Prompt Protection**: ใช้โหมด **"Create Only"** หากใน DB มี Prompt ที่จูนไว้แล้ว สคริปต์จะไม่ไปทับ (รักษา Human Tuning)

## Implementation Plan (Execute Now)

1. `cd projects/mmv-tarots`
2. `mv .env .env.staging` (Backup Staging)
3. `cp ../../.tmp/mmv/.env .env` (Copy Production)
4. ปลด Comment `DATABASE_URL` ใน `.env` ชั่วคราว
5. `npx tsx scripts/hard-reset-and-seed.ts`
6. `mv .env.staging .env` (Restore original state)

## Tags

`mmv-tarots` `production-prep` `hard-reset` `database-hygiene` `safe-environment-swap`
