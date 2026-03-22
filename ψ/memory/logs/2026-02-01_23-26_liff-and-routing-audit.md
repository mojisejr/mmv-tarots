# 🔮 Oracle Snapshot: LIFF & Routing Audit
**Date**: 2026-02-01 23:26 GMT+7
**Project**: `mmv-tarots`
**Issue Reference**: #line-integration

## 📋 สรุปการค้นพบ (Discoveries)

เราได้ตรวจสุขภาพของ Routing ในโปรเจค `mmv-tarots` เพื่อเตรียมเชื่อมต่อกับ LINE Rich Menu ผลลัพธ์ดังนี้:

### 1. เส้นทางที่พร้อมใช้งาน (Active Routes)
- **Home/Website**: `/` (หน้าแรกสำหรับทำนายดวง)
- **Predictions History**: `/history` (มีโฟลเดอร์รองรับแล้ว)
- **Stars Shop**: `/package` (ระบบเลือกซื้อ Credits)
- **Referral System**: อยู่ในหน้า `/profile` (สามารถใช้ Deep Link ไปที่หน้าโปรไฟล์เพื่อให้ User เห็น Code/Link ได้ทันที)

### 2. ส่วนที่ยังขาด (Missing Links)
- **FAQ & Support**: ยังไม่มีหน้า Page เฉพาะในเว็บไซต์
  - *Oracle Insight*: แนะนำให้ใช้ **LINE Business Manager (Auto-response)** จัดการแทนหน้าเว็บ เพื่อลดความซับซ้อนของระบบ (Robustness over Complexity)

### 3. สถานะ LIFF (LINE Front-end Framework)
- **Current State**: ยังไม่มี SDK ติดตั้งใน `package.json`
- **Verification**: `grep` ไม่พบร่องรอยของ LIFF implementation เดิม
- **Auth Compatibility**: ระบบใช้ `Better Auth` ซึ่งจัดการเรื่อง Referral Persistence ใน LINE IAB (In-App Browser) ไว้แล้วระดับหนึ่ง

---

## 💡 คำแนะนำเชิงเทคนิค (Technical Recommendations)

### แผนการเชื่อมต่อ (Recommended Strategy)
1. **Rich Menu Mapping (Immediate)**:
   - ใช้ **Standard URLs** (เช่น `https://www.mimivibe-tarot.com/history`) ไปก่อนเพื่อความรวดเร็วในการ Launch
   - **Support/FAQ**: ตั้งค่าใน LINE OA ให้ปุ่มนี้ส่ง "Keyword" เข้าห้องแชท เพื่อเรียก Auto-response หรือคุยกับ Admin

2. **LIFF Modernization (Next Step)**:
   - หากต้องการประสบการณ์แบบ "Mini App" (ไม่มี Address Bar, แชร์ง่าย):
     - ติดตั้ง `@line/liff`
     - ตั้งค่า `Base URL` เป็น LIFF ID (เช่น `https://liff.line.me/200xxxxxxx-abc`)
     - **ข้อควรระวัง**: ต้องทดสอบ Auth Redirect ของ Better Auth ภายใน LIFF Container อีกครั้งเพื่อป้องกัน Session หลุด

3. **Domain Branding**:
   - ควรใช้ Canonical Domain เสมอ (เช่น `www.mimivibe-tarot.com`) ในการผูก Rich Menu เพื่อให้ Sentry จับ Error ได้ถูกต้องตามโปรโตคอลที่ตั้งไว้

---

## 🛡️ Oracle's Verdict
"ระบบพื้นฐานพร้อมสำหรับการ Launch ผ่าน LINE OA แล้ว Routing ภายในครอบคลุมฟีเจอร์หลักทั้งหมด แนะนำให้เริ่มด้วย URL ปกติก่อนเพื่อรวบรวม Data แล้วค่อยอัปเกรดเป็น LIFF เมื่อต้องการ Scale ประสบการณ์ผู้ใช้ภายในแอป LINE"

**Status**: ✅ Audited & Logged
**Next Action**: รอคุณนนท์เลือกแนวทาง (Standard URL vs LIFF) เพื่อเริ่ม Configure Rich Menu ใน LINE Manager