# Snapshot: Final Implementation Plan for Neon Robust Workflow (Revised v2)
**Timestamp**: 2026-01-09 21:05 GMT+7 (Updated: 21:30)
**Project**: mmv-tarots
**Strategy**: Single Rotating Native Snapshot

## 1. Safety Guardrails (Phase 1)
- **Local Drift Analysis**: ก่อนรัน `migrate deploy` Oracle จะสแกนไฟล์ SQL ใน `prisma/migrations` เพื่อตรวจหาคำสั่งอันตราย เช่น `DROP TABLE`, `DROP COLUMN`, หรือ `TRUNCATE`
- **Impact Report**: รายงานสรุปให้มนุษย์ทราบว่าการ Migrate ครั้งนี้จะกระทบกี่ Table

## 2. Single Rotating Snapshot (Phase 2) 📸
เปลี่ยนจาก Branch Rotation เป็น Native Snapshot เพื่อความสะอาดและตรงจุดประสงค์
จะใช้ Script `scripts/neon-snapshot-rotate.sh` ซึ่งมีตรรกะดังนี้:
1. **Find Existing Snapshot**: ค้นหา Snapshot ที่ชื่อว่า `pre-deploy-backup`
2. **Cleanup**: ถ้าเจอ ให้สั่งลบ Snapshot เดิมทิ้ง (เพื่อประหยัด Quota และลดความสับสน)
3. **Capture**: สั่งสร้าง Snapshot ใหม่จาก `main` branch ตั้งชื่อ `pre-deploy-backup`
4. **Validation**: รอจนกว่า Snapshot status จะสมบูรณ์

## 3. Disaster Recovery (Phase 3) 🚑
- **Method**: ใช้ Neon Console -> Backup & Restore -> เลือก `pre-deploy-backup` -> กด **One-step restore**
- **Fallback**: หาก Console เข้าไม่ได้ สามารถใช้ Script ยิง API เพื่อสั่ง Restore ได้เช่นกัน

## 4. Modified Developer Workflow (Strict Git Flow)
1. **Feature Implementation**: ทำงานบน `feat/xyz` branch
2. **Local Staging Sync**:
   - `git checkout staging` -> `git merge feat/xyz` (Local Only)
   - `npm run migrate:safe --target=staging` (Oracle เช็ค SQL + รันบน Staging DB)
   - **Local Verification**: ทดสอบผ่าน Staging DB
3. **Remote Staging Build**:
   - `git push origin staging`
   - **Preview URL Test**: ตรวจสอบบน Vercel Preview
4. **Production Handover**:
   - **Snapshot Production**: รัน `npm run db:snapshot-prod` (เรียก Script Rotating Snapshot)
   - **Open Pull Request**: สร้าง PR จาก `staging` -> `main`
   - **Merge & Deploy**: เมื่อ Merge บน GitHub -> Vercel รัน `migrate deploy` โดยมี Snapshot ล่าสุดรองรับอยู่

---
**Next Step**: Implementation of `scripts/neon-snapshot-rotate.sh`
