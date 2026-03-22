# Snapshot: การปรับปรุง Theme และแก้ไข Accessibility สำหรับ mmv-tarots

**Time**: 2026-01-04 15:20
**Context**: การเปลี่ยน Theme จาก Dark Mode เป็น "Morning Mystic" (Light/Moody) และการแก้ไขปัญหาตัวอักษรอ่านยากเนื่องจากสีกลืนกับพื้นหลัง

## Insight

1. **Tailwind CSS v4 Migration Issues**:
   - การย้ายจาก `tailwind.config.ts` มาใช้ CSS-first configuration (`@theme` ใน `globals.css`) พบว่าค่าบางอย่างเช่น `box-shadow` หรือ custom variables ที่เคยประกาศใน JS อาจไม่ถูกดึงมาใช้โดยอัตโนมัติหากไม่ได้ประกาศใน CSS block ของ v4
   - การใช้ `var(--color-primary)` ใน class โดยตรงอาจทำให้เกิดปัญหาถ้า Tailwind ไม่ได้ทำ mapping ไว้ใน `@theme`

2. **Accessibility Debt**:
   - การพัฒนาแบบ "Dark Mode First" ทำให้มีการใช้ class `text-white` หรือ `text-white/60` แบบ hardcoded กระจายอยู่ทั่ว codebase
   - เมื่อเปลี่ยนพื้นหลังเป็นสีสว่าง (Soft Rose `#FFF0F0`) ตัวอักษรสีขาวจะกลายเป็น "Invisible" ทันที

3. **Semantic Solution**:
   - การแก้ไขที่ยั่งยืนคือการเปลี่ยนจากสีคงที่ (`text-white`) เป็นสีเชิงความหมาย (Semantic) เช่น `text-foreground` และ `text-muted-foreground`
   - การสร้าง Utility class เช่น `glass-mimi` ช่วยให้การจัดการ Glassmorphism ใน Light Mode มีความสม่ำเสมอและแก้ไขได้จากจุดเดียว

## Apply When

- เมื่อมีการเปลี่ยน Theme หลักของโปรเจกต์ (Re-theming)
- เมื่อต้องการย้ายโปรเจกต์จาก Tailwind v3 ไป v4
- เมื่อพบปัญหา Accessibility ในส่วนของ Contrast Ratio

## Tags

`tailwind-v4` `accessibility` `theme-refactor` `mmv-tarots` `glassmorphism`
