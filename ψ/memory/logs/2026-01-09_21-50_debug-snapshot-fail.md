# Snapshot: Neon Native Snapshot API - FIXED
**Timestamp**: 2026-01-09 22:00 GMT+7
**Project**: mmv-tarots
**Resolution**: Fixed JSON parsing and Endpoint naming.

## Analysis & Fix
- **Issue**: การใช้ `grep` เพื่อดึง Branch ID ล้มเหลวเนื่องจาก JSON ของ Neon API มีข้อมูลหลายบรรทัด
- **Fix 1 (Parsing)**: เปลี่ยนมาใช้ `python3` (ซึ่งมีติดเครื่องอยู่แล้ว) มาช่วย Parse JSON ทำให้การดึง `branch_id` และ `snapshot_id` แม่นยำ 100%
- **Fix 2 (Endpoint)**: ปรับ Endpoint จาก `/snapshots` (plural) เป็น `/snapshot` (singular) ตามเอกสารล่าสุดสำหรับคำสั่ง Create
- **Final Result**: Script สามารถตรวจหา Snapshot เก่าที่ชื่อ `pre-deploy-backup` -> ลบทิ้ง -> แล้วสร้างใหม่ได้แบบอัตโนมัติ (Rotating)

---
**Status**: Ready for Final Test.
