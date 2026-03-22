# Snapshot: Essential Unit Testing for Auth Hardening (REVISED V4)

**Time**: 2026-03-08 14:26 (+07)
**Context**: `projects/mmv-tarots` - การวางแผนระบบ Auth Hardening (Phase 5)

## 🎯 Insight
การ Implement ระบบที่มีความสำคัญสูง (Highly Sensitive) อย่าง Authentication และ Referral ในสภาพแวดล้อมที่เฉพาะเจาะจง (LIFF) จำเป็นต้องมี Unit Test ชิ้นเล็กๆ ที่แม่นยำเพื่อป้องกัน Regression ในอนาคต โดยเฉพาะจุดที่เงื่อนไขมีการเปลี่ยนแปลงบ่อย เช่น Middleware Redirect และ URL Generation Logic

## 🔍 Evidence
- **Grounding Detail**: ตรวจสอบพบไฟล์ `lib/referral-utils.ts` และ `middleware.ts` แล้ว พร้อมสำหรับการ Patch เทสต์
- **Blueprint Updated**: แผนงาน Phase 5 ถูกอัปเกรดเป็น V4 โดยการแทรก **Phase 5.4: Essential Unit Testing** และเลื่อน Payment UI ไปเป็น Phase 5.5
- **System Safety**: การเพิ่มด่านเทสต์ Middleware จะช่วยการันตีว่า User ที่ไม่มี Session จะถูก Redirect ไปหา `/liff` ได้ 100% ตามแผน

## 🛡️ Guardrails
- **Minimalist Approach**: เขียนเทสต์เฉพาะที่จำเป็น (High-signal unit tests) เพื่อไม่ให้เป็นการเพิ่ม Technical Debt ในอนาคต
- **Isolated Logic**: เน้นเทสต์ Logic ของ Referral Wrapper และ Middleware Protection โดยแยกส่วนออกจาก UI

## 🚀 Next Actions
- [ ] Implement `app/liff/page.tsx` (Phase 5.1)
- [ ] Update `lib/referral-utils.ts` (Phase 5.2)
- [ ] Write Unit Tests defined in Phase 5.4

## Tags
#mmv-tarots #unit-test-plan #auth-hardening #referral-wrap #middleware-protection #v4-blueprint #sss
