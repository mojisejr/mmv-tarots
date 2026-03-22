# Snapshot: LINE LIFF Integration Strategy (mmv-tarots)

**Time**: 2026-03-06 22:30 GMT+7
**Context**: `mmv-tarots` / Platform Evolution to LIFF.
**Decision ID**: `#MMV-LIFF-INTEGRATION-01`

## Purpose
วางแผนการย้าย Web App แบบเดิมเข้าสู่ **LINE Front-end Framework (LIFF)** เพื่อลด Friction ในกระบวนการ Login และสร้าง Seamless Payment Experience (Manual QR) ให้กับ User ใน Ecosystem ของ LINE.

## Insight
1. **Auth Continuity**: เรามีระบบ `better-auth` + `LINE Login` อยู่แล้ว การย้ายไป LIFF สามารถใช้ User ID เดิมในฐานข้อมูลได้ทันที (Zero Data Loss)
2. **Contextual Intelligence**: LIFF ช่วยให้เข้าถึง Profile, Language, และ OS ของ User ได้โดยไม่ต้องผ่านกระบวนการ OAuth Redirect ที่ซับซ้อนในทุกครั้ง
3. **Robust Ops**: การใช้ `liff.sendMessages()` และการผูกบัญชี LINE ช่วยให้นโยบาย "แจ้งโอนเงินมือ" ทำงานได้จริงเสมือนแอป Mobile Native

## Implementation Blueprint
- **SDK**: ติดตั้ง `@line/liff` เป็น Client-side SDK
- **Hybrid Auth**: พัฒนา `LiffProvider` เพื่อ Verify LIFF Access Token กับ Backend `/api/auth/liff-verify`
- **UI Transition**: ปรับ `Viewport` และ `Auth Guard` ให้ตรวจจับ LIFF Context เพื่อซ่อน/แสดง Navigation ที่เหมาะสม

## Risks & Guardrails
- **Browser Compatibility**: ต้องรักษาความเป็นเว็บมาตรฐานไว้สำหรับ User ที่เข้าผ่าน Facebook หรือ Browser อื่น (Maintain Hybrid Support)
- **Token Expiry**: ต้องบริหารจัดการคิวการ Refresh Token ของ LIFF ให้สอดคล้องกับ `better-auth` session

## Next Actions
- [ ] ติดตั้ง package `@line/liff` ในโปรเจกต์
- [ ] สร้าง `projects/mmv-tarots/components/providers/LiffProvider.tsx`
- [ ] ออกแบบ API Route สำหรับการ Verify Token ฝั่ง Server

## Tags
`sss` `mmv-tarots` `line-liff` `auth-evolution` `seamless-ux` `strategy`
