# Snapshot: Final Implementation Plan (Remaining Steps)
**Timestamp**: 2026-01-09 22:15 GMT+7
**Project**: mmv-tarots
**Goal**: Integrate the Safety Scanner and Automate Vercel Migrations.

## 1. Safety Guardrail: The SQL Scanner (Next) 🕵️‍♂️
เราจะสร้าง `scripts/prisma-safety-check.js` (Node.js) เพื่อทำหน้าที่:
- **Scan**: มองหาไฟล์ `migration.sql` ล่าสุดที่เพิ่งถูกสร้าง
- **Detect**: ตรวจสอบคำสั่งอันตราย (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `ALTER ... RENAME`)
- **Report**: ถ้าเจอคำสั่งเสี่ยง จะ "หยุด" การทำงานและบังคับให้มนุษย์ยืนยัน (Force confirmation)
- **Status**: กำลังเริ่มทำ

## 2. Vercel Automation: The Build Link 🔗
เพื่อให้ Vercel รัน Migrate อัตโนมัติ เราจะปรับ `package.json`:
- **Command**: `build`: `prisma generate && prisma migrate deploy && next build`
- **Why?**: เมื่อ Merge PR ไปที่ `main` -> Vercel จะดึง `DATABASE_URL` (Production) มาใช้รันคำสั่งนี้โดยอัตโนมัติ
- **Safety**: มั่นใจได้เพราะเราได้ผ่านการรัน `migrate:safe` บน Staging และทำ Snapshot สำรองข้อมูลไว้แล้วก่อนกด Merge

## 3. The "Safe Migrate" Local Script 🛡️
เราจะรวมร่างคำสั่งใน Local ให้เหลือเพียง:
- `npm run migrate:safe`: 
  1. รัน Scanner
  2. ถ้าผ่าน -> รัน `prisma migrate deploy` ใส่ DB ปลายทาง (Staging/Prod)

## 4. Final Final Workflow (The Golden Path)
1. **โค้ด**: แก้ Schema บน feature branch.
2. **ตรวจ**: `npm run migrate:safe` (รันใส่ Staging DB บน Cloud จากเครื่องเรา).
3. **สำรอง**: `npm run db:snapshot-prod` (สำรอง Prod DB ไว้ก่อน).
4. **ส่ง**: สร้าง PR -> เมื่อ Merge ปุ๊บ Vercel จะรัน `migrate deploy` ใส่ Prod ให้เองทันที

---
**Next Step**: Implementation of `scripts/prisma-safety-check.js`
