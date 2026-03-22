# Snapshot: LINE In-App Browser Cookie Loss & Referral Fix Plan

**Time**: 2026-01-21 14:22
**Context**: การวิเคราะห์ปัญหา Referral ทะลุผ่าน LINE In-App Browser และการวางแผนแก้ไขเชิงระบบสำหรับ mmv-tarots

## Insight

ปัญหาหลักคือ **"Browser Isolation"** ของ LINE In-App Browser (IAB):
1.  **Cookie Limitation**: เมื่อเปิดลิงก์จาก LINE แชท ตัวคุกกี้ `mmv_ref` จะถูกเก็บไว้ใน IAB เท่านั้น
2.  **External Redirect**: เมื่อทำการ Login ด้วย LINE ระบบมักจะ Redirect กลับมาที่ External Browser (Safari/Chrome) ซึ่งไม่มีคุกกี้ที่เซ็ตไว้ในตอนแรก ทำให้ระบบ Referral พัง (Fall back เป็นการสมัครธรรมดา)
3.  **Silent Fail**: ระบบในปัจจุบันเลือกที่จะปล่อยให้สมัครผ่านได้เพื่อให้ User Journey ไม่สะดุด แต่ทำให้เสียสิทธิ์ในการรับโบนัสแนะนำเพื่อนโดยที่ User ไม่รู้ตัว

## Recommended Action Plan (Simple + Robust)

1.  **URL Parameter Persistence (High Priority)**:
    *   แก้ไขปุ่ม Login ให้ตรวจสอบ Parameter `ref` จาก URL ปัจจุบัน
    *   ส่งค่าเข้า `callbackURL` ของ OAuth (เช่น `callbackURL: "/?ref=XYZ"`) เพื่อให้รหัสแนะนำ "ข้าม" Browser ตามมาได้ทาง URL ขากลับ แม้คุกกี้จะหายไป
2.  **Manual Referral Input (Robustness)**:
    *   เพิ่มฟิลด์ "ใส่รหัสเพื่อน" หรือ "Redeem Code" ในหน้า Profile
    *   รองรับทั้งการใส่เฉพาะ Code หรือวางลิงก์ทั้งอัน โดยให้ระบบ Auto-extract รหัสออกมา
    *   กำหนดระยะเวลา (Grace Period) เช่น ภายใน 24 ชม. หลังสมัคร เพื่อป้องกันการปั๊มแต้มย้อนหลัง
3.  **UI Tracking**:
    *   แสดงสถานะว่า "มีการนำเข้ารหัสแนะนำแล้ว" ตั้งแต่หน้าแรก เพื่อให้ User มั่นใจว่าไม่ได้ทำอะไรพลาด

## Apply When

- เมื่อสรุปแนวทางการแก้ไขระบบ Referral ให้มีความทนทานต่อ LINE Ecosystem
- เมื่อต้องการแก้ไขปัญหาความต่อเนื่องของ Data ระหว่าง In-App Browser และ System Browser ในโปรเจกต์ Next.js

## Tags

`line-iab` `cookie-loss` `referral-fix` `mmv-tarots` `better-auth`
