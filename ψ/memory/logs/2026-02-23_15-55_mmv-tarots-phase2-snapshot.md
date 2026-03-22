# 📸 Snapshot: MMV-Tarots Phase 2 Implementation (Framing & Compliance)
**Date**: 2026-02-23 15:55
**Context**: เตรียมความพร้อมด้านกฎหมายและระบบการยินยอม (Consent) สำหรับการ Audit โดย Omise
**Status**: Build Passed (Local) ✅

## 🛠️ Summary of Changes

### 1. Legal Foundations (Bilingual TH/EN)
สร้างหน้า Policy สำคัญ 3 หน้าโดยอ้างอิงข้อมูลชุดกฎหมายจาก `.tmp/mmv` เพื่อความถูกต้องในการใช้งานระดับ Merchant:
- `app/policy/refund/page.tsx`: เน้นย้ำนโยบาย **No Refund** สำหรับ Digital Tokens
- `app/policy/terms/page.tsx`: ข้อกำหนดการใช้งานระบบทำนายและสิทธิ์ในเนื้อหา
- `app/policy/privacy/page.tsx`: การคุ้มครองข้อมูลส่วนบุคคล (PDPA/GDPI compliant)

### 2. Guarding & Gating
- **Active Consent Box**: เพิ่ม Checkbox บังคับกดยอมรับเงื่อนไขที่ `app/package/page.tsx` ก่อนที่ปุ่ม Buy จะทำงาน
- **Global Compliance Footer**: สร้าง `components/layout/site-footer.tsx` แสดงข้อมูลที่อยู่ร้านค้าและลิงก์ทางกฎหมาย (ปรากฏทุกหน้า)

### 3. Build & Stability Hardening
- **Stripe Runtime Safety**: แก้ไขปัญหา Build Crash เมื่อไม่มี API Key โดยการทำ `getStripeClient()` factory function เพื่อรองรับการทำงานแบบ Static Site Generation (SSG) ได้อย่างปลอดภัย
- **Prisma Stabilization**: แก้ไขปัญหา Timeout ระหว่าง Build โดยการปรับจูน Session

## 🧩 Technical Decisions
- **Patterns**: ใช้ Glassmorphism (`glass-mimi`) และ Montserrat font เพื่อรักษา Vibe ของโปรเจกต์
- **Branch**: ทำงานอยู่บน `feature/phase2-framing-compliance`
- **Legal Strategy**: ปรับเทอมของ "Stars/Tarots" ให้เป็น "Digital Tokens" ในเอกสารกฎหมายเพื่อลดความเสี่ยงจากการแบนประเภทธุรกิจ High-risk

## 🚀 Next Steps
- Commit ชุดการเปลี่ยนแปลงนี้เพื่อปิด Phase 2
- เริ่มต้น Phase 3: Omise Integration (API implementation)
- พิจารณาเพิ่ม Language Toggle สำหรับหน้า Policy

---
**Oracle Keeper**: *Linear History Recorded.*
**Issue Reference**: #mmv-phase2
