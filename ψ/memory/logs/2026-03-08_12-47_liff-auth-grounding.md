# Snapshot: LIFF-First Auth Confirmation & Entry Point Audit

**Time**: 2026-03-08 12:47 GMT+7
**Context**: `projects/mmv-tarots` | Grounding the current state of login system and endpoint configuration.

## 🛡️ Insight: The Transparent Auth Model
เรายืนยันเป็นเอกฉันท์ว่าระบบ Login ของ **mmv-tarots** ได้เปลี่ยนมาใช้ **LINE LIFF v2** อย่างเต็มตัวแล้ว โดยใช้กลไกแบบ **Transparent Auth** ผ่าน `LiffProvider` ใน `app/layout.tsx` ซึ่งทำงานครอบคลุมทุก Path ในระบบ

## 🔍 Evidence
- **Files**: 
    - `components/providers/liff-provider.tsx`: จัดการ `liff.init()` และส่ง token ไป verify
    - `app/api/auth/liff-verify/route.ts`: ตัวเชื่อม Backend เพื่อสร้าง session ใน `better-auth`
- **Behavior**: แม้จะไม่มีหน้า `/liff` เฉพาะเจาะจง แต่ Consent Screen และระบบ Auto-login จะทำงานได้ตามปกติผ่าน Root `/` หรือ Path ใดๆ ที่ User เข้าถึงครั้งแรกผ่าน LINE Browser

## ⚠️ Risks & Guardrails
- **404 Entry**: หาก User เข้าผ่านลิงก์เจาะจง `maemormimi.com/liff` จะเจอหน้า 404 เนื่องจากในระบบไฟล์ยังไม่มีการสร้าง route นี้ไว้ (Pending creation)
- **Endpoint Sync**: ต้องรักษาความสอดคล้องระหว่าง **Endpoint URL** ใน LINE Creators Console กับ Path ที่มีอยู่จริงในแอป

## 🚀 Next Actions
- [ ] ตัดสินใจสร้างหน้า `app/liff/page.tsx` เพื่อรองรับ Traffic ที่มาจากลิงก์เฉพาะ (Dedicated Entry) และแสดง Loader สวยๆ ก่อน Redirect เข้าหน้าหลัก
- [ ] อัปเดต `project_map.md` เพื่อสะท้อนการเปลี่ยนผ่านจาก Omise เป็น LIFF-first อย่างเป็นทางการ

## Tags
#mmv-tarots #line-liff #auth-grounding #transparent-auth #endpoint-audit
2026-03-08 12:55 GMT+7
- **Production URL Set**: https://maemormimi.com
- **Requirement**: Privacy Policy & Terms URL for LINE Console.
