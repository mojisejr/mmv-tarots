# Snapshot: ปัญหา Accessibility และ UI หลังการเปลี่ยน Theme (Phase 2)

**Time**: 2026-01-04 15:30
**Context**: ตรวจสอบความเรียบร้อยหลังการเปลี่ยน Theme เป็น "Morning Mystic" พบจุดที่ยังเป็น Hardcoded และมีปัญหา Contrast

## Insight

1. **Hardcoded UI Elements**:
   - พบการใช้สีแบบ Hardcoded (เช่น `text-white`, `bg-black/60`) ในจุดสำคัญที่ควรใช้ UI Tokens
   - **Home Page**: คำว่า "do you seek?" มีปัญหา Contrast อย่างมาก
   - **History Page**: Filter และ Search box ยังอ่านยาก
   - **History Card**: Hover state และ Logo/Icon มองไม่เห็น (Invisible)
   - **History Detail**: Hover card ของไพ่มีปัญหาเรื่องการแสดงผลและ Contrast

2. **Lack of Robust UI Tokens**:
   - ปัญหาเกิดจากการไม่ได้ใช้ Semantic Classes หรือ CSS Variables ที่ครอบคลุมทุก State (เช่น Hover, Active, Focus)
   - การแก้ไขแบบจุดต่อจุด (Ad-hoc) ทำให้เกิดความผิดพลาดได้ง่ายเมื่อมีการเปลี่ยน Theme ในอนาคต

3. **Systematic Failure**:
   - ระบบเดิมไม่ได้ออกแบบมาให้รองรับ Multi-theme อย่างแท้จริง ทำให้ต้องมาไล่แก้ทีละไฟล์แทนที่จะแก้ที่ Theme Definition

## Apply When

- เมื่อต้องการวางแผนแก้ไข UI ให้เป็นระบบ (Robust + Simple)
- เมื่อต้องการสร้างมาตรฐาน UI Tokens สำหรับโปรเจกต์ Next.js + Tailwind v4
- เมื่อต้องการเตรียมความพร้อมสำหรับการเปลี่ยน Theme ในอนาคตโดยไม่กระทบ Accessibility

## Tags

`ui-tokens` `accessibility-audit` `systematic-fix` `tailwind-v4` `mmv-tarots`
