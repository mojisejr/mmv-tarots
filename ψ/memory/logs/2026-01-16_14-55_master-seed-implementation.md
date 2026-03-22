# Snapshot: Unified Master Seed Implementation

**Time**: 2026-01-16 14:55 GMT+7
**Context**: Implement `prisma/seed.ts` เพื่อรวบรวม Database Seeding ทั้งหมดไว้ในที่เดียว รองรับ Stripe Production

## 1. Unified Logic
รวม Seeding Logic จาก 4 แหล่งไว้ในไฟล์เดียว:
- **Cards**: ดึงจาก `docs/card.csv`
- **Agents**: อ่านจาก `lib/server/ai/prompts/*.ts` และทำการ **Encrypt** อัตโนมัติ
- **Packages**: อ่านจาก `.tmp/master-seed-config.json` (รองรับ Live Price IDs)
- **Questions**: เพิ่ม Suggested Questions ที่เป็น Feature ใหม่

## 2. Safety First
- สคริปต์ทำงานในโหมด **"Clean & Re-seed"** สำหรับ Master Data เท่านั้น
- **ไม่ลบ** ข้อมูล User, Transaction หรือ History ใดๆ
- เหมาะสำหรับรันก่อน Deploy Production เพื่อให้ Config ทุกอย่าง (โดยเฉพาะราคา) เป็นค่าล่าสุด

## 3. Execution
```bash
npx prisma db seed
```
(ต้องเรียกผ่าน `prisma/seed.ts` ซึ่งตั้งค่าไว้ใน package.json หรือรันผ่าน `npx tsx prisma/seed.ts` โดยตรง)

## Tags
`seeding` `production` `prisma` `master-data`
