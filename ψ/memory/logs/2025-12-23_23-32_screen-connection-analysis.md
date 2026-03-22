---
type: snapshot
project: mmv-tarots
topic: screen-connection-analysis
status: completed
---

# Snapshot: การวิเคราะห์ความเชื่อมโยงหน้าจอและ User Journey (mmv-tarots)

**เวลา**: 2025-12-23 23:32 GMT+7
**บริบท**: วิเคราะห์จุดบกพร่องในการเชื่อมต่อระหว่างหน้าจอ (Home, Submitted, History, Profile) และช่องว่างใน User Journey หลังจากทำ Refactor Phase 1-5 เสร็จสิ้น

## ผลการวิเคราะห์ (Analysis Findings)

### 1. ปัญหาด้าน Authentication (Auth Gaps)
- **Home Submit Flow**: หน้า Home อนุญาตให้พิมพ์คำถามและกดส่งได้เลย แต่ API `/api/predict` บังคับ Auth ทำให้ผู้ใช้ที่ไม่ได้ล็อกอินเจอ Error 401 โดยไม่มีคำแนะนำที่ชัดเจน
- **History/Profile Loading**: เมื่อ `fetchUserPredictions()` คืนค่า 401 หน้าจอจะแสดงเพียง "Failed to load predictions" ซึ่งไม่สื่อสารให้ผู้ใช้ไปล็อกอิน

### 2. ความทนทานของระบบ (Resilience & Persistence)
- **Job ID Persistence**: หน้า `Submitted` พึ่งพา `jobId` จาก URL query param เป็นหลัก หากผู้ใช้รีเฟรชหน้าจอหรือเข้าผ่านลิงก์ที่ไม่มี param ระบบจะ redirect กลับหน้า Home ทันที ทั้งที่มีข้อมูลสำรองใน `sessionStorage`
- **Polling Cleanup**: ในหน้า `History/[id]` มีการสร้าง interval สำหรับ polling แต่การจัดการ cleanup (clearInterval) ยังไม่ครอบคลุมทุกกรณี เสี่ยงต่อ memory leak

### 3. การประมวลผลข้อมูล (Data Mapping)
- **Strict Mapping**: `mapReadingData` มีการตรวจสอบฟิลด์ที่เข้มงวดเกินไป (เช่น ต้องเป็น `name_th` เท่านั้น หรือ `position` ต้องเป็น number) หากโครงสร้างข้อมูลจาก AI/Backend เปลี่ยนไปเพียงเล็กน้อย หน้าจอจะแสดงผลล้มเหลวทันที

### 4. ชุดทดสอบ (Test Regressions)
- **Broken Tests**: หลังจากการย้ายไฟล์ (Refactor) ชุดทดสอบล้มเหลวเป็นจำนวนมาก (89 failed) เนื่องจากปัญหาเรื่อง Mocking และ Import paths ที่เปลี่ยนไป ทำให้ไม่สามารถยืนยันความถูกต้องของระบบได้ 100%

## แผนการแก้ไข (Action Plan)

### ระยะสั้น (Immediate Fixes)
- [ ] **Auth UX**: เพิ่มการตรวจสอบ Auth ก่อนส่งคำถามที่หน้า Home หรือจัดการ Error 401 ให้แสดง Login CTA
- [ ] **API 401 Handling**: ปรับปรุง `fetchUserPredictions` ให้แยกแยะ Error 401 และแสดง UI สำหรับล็อกอินในหน้า History/Profile
- [ ] **Submitted Fallback**: ให้หน้า `Submitted` ลองดึง `jobId` จาก `sessionStorage` หากใน URL ไม่มีข้อมูล

### ระยะกลาง (Stability & Polish)
- [ ] **Polling Fix**: ปรับปรุง useEffect ใน `History/[id]` ให้จัดการ cleanup interval อย่างถูกต้อง
- [ ] **Flexible Mapping**: ปรับปรุง `mapReadingData` ให้รองรับฟิลด์หลายรูปแบบ (e.g., `nameTh`, `displayName`) และมีระบบ fallback ที่ดีขึ้น
- [ ] **Test Restoration**: ทยอยแก้ไขชุดทดสอบที่ล้มเหลว โดยเริ่มจากส่วนที่สำคัญที่สุด (Auth & Core Flow)

---
**Oracle Note**: การวิเคราะห์นี้ช่วยให้เราเห็นภาพรวมของ "รอยต่อ" ที่ยังไม่สนิท การแก้ปัญหาเหล่านี้จะช่วยให้ Solo Dev มั่นใจในระบบมากขึ้นก่อนเปิดใช้งานจริง
