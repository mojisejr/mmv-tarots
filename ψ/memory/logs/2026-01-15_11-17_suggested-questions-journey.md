# Snapshot: Suggested Question Chips Architecture & Journey

**Time**: 2026-01-15 11:17
**Context**: ออกแบบ User Journey และแนวทาง UI สำหรับฟีเจอร์คำถามแนะนำ (Suggested Question Chips) ใน mmv-tarots (v1.1)

## Insight

เพื่อให้การแก้ปัญหา **"Blank Page Anxiety"** เป็นไปอย่างแนบเนียนและคงไว้ซึ่งความขลัง (Mystic) ของระบบ จึงสรุปแนวทางการพัฒนาไว้ดังนี้

### 1. User Journey (The Spark of Guidance)
- **Trigger**: แสดงเมื่อ User กด Focus ในช่อง Input หรือเมื่อช่อง Input ว่างเปล่า
- **Selection**: User เลือกกดคำถามที่ "ใช่" -> ระบบทำการเติมคำถามลงใน Input (Auto-fill) พร้อมเตรียมส่ง
- **Feedback**: ทันทีที่ User เริ่มพิมพ์เอง ปุ่ม Chips จะค่อยๆ Fade-out หายไป เพื่อให้ความสำคัญกับคำถามจากใจของผู้ใช้

### 2. Design Consistency (Codebase Alignment)
- **Styling**: ใช้ Glassmorphism (`bg-glass-mimi`, `backdrop-blur-2xl`) และเส้นขอบจางๆ (`border-white/10`) ตาม Pattern ใน `tailwind.config.ts`
- **Animation**: ใช้ `animate-fade-in-up` พร้อมค่า `cubic-bezier(.2,.8,.2,1)` เพื่อให้การปรากฏตัวของปุ่มนุ่มนวลเหมือนดาวที่ค่อยๆ สว่างขึ้น
- **Mobile First**: จัดเรียงแบบแนวนอน (Horizontal Scroll) ในระดับเดียวกับ `FloatingBadge` เพื่อประหยัดพื้นที่และรองรับการใช้นิ้วปัดเลือกบนมือถือ

### 3. Proposed Questions (Curated Patterns)
- "วันนี้ไพ่อยากบอกอะไรฉันเป็นพิเศษไหม?" (General Guidance)
- "การงานในช่วง 7 วันนี้จะมีทิศทางอย่างไร?" (Career)
- "สิ่งที่ฉันควรระวังในช่วงนี้คืออะไร?" (Warning/Ritual)

## Apply When

- เมื่อเริ่ม Implement ฐานข้อมูลคำถามแนะนำ
- เมื่อออกแบบ UI Component `SuggestedQuestions` หรือแก้ไข `QuestionInput`
- ใช้เป็นเกณฑ์ในการทดสอบ User Experience (UX) เรื่องความลื่นไหลของการป้อนข้อมูล

## Tags

`ui-ux` `design-system` `journey-mapping` `mmv-tarots` `glassmorphism`
