# Snapshot: Sentry Smoke Test Protocol (The Purge Edition)

**Time**: 2026-02-01 22:33
**Context**: ขั้นตอนการทดสอบ Sentry Monitoring ในระบบ Next.js 16 (App Router) แบบละเอียดก่อนการล้างไฟล์ทดสอบ (Zero Residue)

## Insight

แผนการทดสอบแบบแยกฝั่ง (Client/Server) เพื่อยืนยันความถูกต้องของกุญแจ (DSN) และการตั้งค่า Config ทั้งหมด:

### 1. Implementation Phase (Creating The Traps)
สร้างไฟล์ทดสอบแยกส่วนเพื่อไม่ให้กระทบ Business Logic เดิม:
- **Backend Trap**: `app/api/test-sentry/route.ts` 
  - สร้าง API ที่จงใจ `throw new Error()` เมื่อถูกเรียกด้วย GET Request.
- **Frontend Trap**: `app/test-sentry/page.tsx`
  - สร้างหน้าที่ประกอบด้วยปุ่ม "Break Client" เมื่อกดจะเกิด Runtime Exception.

### 2. Execution Phase (The Stress Test)
- **Backend Validation**: รันคำสั่ง `curl localhost:3000/api/test-sentry` เพื่อกระตุ้น Error ฝั่ง Server.
- **Frontend Validation**: (Human-Triggered) ผู้ใช้เข้าถึง `/test-sentry` และกดปุ่มเพื่อกระตุ้น Error ฝั่ง Client.
- **Dashboard Monitoring**: ตรวจสอบใน Sentry Dashboard ว่าพบ Error จากทั้งสองจุดพร้อม Stack Trace ที่ถูกต้องหรือไม่.

### 3. Cleanup Phase (The Purge)
ล้างข้อมูลทดสอบให้สะอาด 100%:
- **Delete Files**: ลบไฟล์ที่สร้างในข้อ 1 ทันทีหลังยืนยันผล.
- **Hard Gate**: รัน `npm run build` และ `npm run lint` อีกครั้งเพื่อยืนยันว่าไม่มีผลกระทบตกค้าง.
- **Git State**: ตรวจสอบ `git status` เพื่อยืนยันว่าไม่มีไฟล์แปลกปลอมหลุดเข้าไปใน Commit.

## Apply When
- ก่อนการ Deploy ขึ้น Production ของโปรเจกต์ที่ติดตั้งระบบ Monitoring ใหม่.
- เมื่อมีการแก้ไขระบบ Middleware หรือ Config ระดับลึกของ Next.js.

## Tags
`sentry` `smoke-test` `testing-protocol` `zero-residue` `mmv-tarots` `production-ready`
