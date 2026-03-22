# Snapshot: Unified Seed & Hard Reset Implementation

**Time**: 2026-01-16 GMT+7
**Context**: เตรียมระบบ Seeding และการทำความสะอาดฐานข้อมูล (Data Hygiene) ให้สมบูรณ์แบบเพื่อรองรับการเจาะตลาด Production ครั้งแรก

## 1. Unified Master Seed Script
สร้างสคริปต์ [prisma/seed.ts](projects/mmv-tarots/prisma/seed.ts) เพื่อรวมศูนย์การตั้งค่า Master Data ทั้งหมด:
- **Cards**: โหลดไพ่ 78 ใบจากไฟล์ CSV
- **AgentConfigs**: ดึง Prompt จาก Source Code มาทำการ **Auto-Encrypt** และบันทึกอัตโนมัติ
- **StarPackages & Prices**: เชื่อมต่อกับ Stripe Live Price IDs ผ่านไฟล์ config
- **Suggested Questions**: Seed คำถามแนะนำ 10 ข้อที่ออกแบบไว้เพื่อช่วยผู้ใช้งานเริ่มต้น

## 2. Hard Reset & Fresh Start Mechanism
สร้างสคริปต์ [scripts/hard-reset-and-seed.ts](projects/mmv-tarots/scripts/hard-reset-and-seed.ts) สำหรับการ "ล้างบาง" ข้อมูลทั้งหมด:
- **Wipe Everything**: ลบข้อมูล Users, Transactions, Predictions, และ Master Data
- **Safety Lock**: มีระบบ interactive prompt ถามเพื่อยืนยันการลบ โดยเฉพาะในโหมด Production
- **Security**: ไฟล์นี้ถูกเพิ่มลงใน `.gitignore` เรียบร้อยแล้วเพื่อความปลอดภัย ไม่ให้นำขึ้น Repository

## 3. Data Integration State
- ข้อมูลราคา (Price IDs) ถูกดึงจาก [.tmp/master-seed-config.json](projects/mmv-tarots/.tmp/master-seed-config.json) ซึ่งเป็นไฟล์ gitignored (Security Best Practice)
- ระบบพร้อมสำหรับการรัน Seeding บน Production ทันทีที่แก้ไข ENV เสร็จสิ้น

## 4. Next Steps
- รันการ Seeding ครั้งแรกบนระบบจริง
- ตรวจสอบความถูกต้องของข้อมูลในฐานข้อมูลหลัง Seed
- เริ่มกระบวนการโปรโมทแพลตฟอร์ม

## Tags
`mmv-tarots` `seeding` `hard-reset` `data-security` `production-ready` `stripe-live`
