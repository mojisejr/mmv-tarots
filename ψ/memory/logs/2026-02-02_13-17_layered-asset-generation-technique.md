# 📸 Snapshot: Layered Asset Generation Technique
**Date**: 2026-02-02 13:17 GMT+7
**Project**: `mmv-tarots` / Shared UI Guidelines
**Topic**: "The 3-Step UI Asset Workflow" (Background -> Icons -> Text)

## 💡 The Discovery
เมื่อต้องการสร้าง Asset สำหรับ UI ที่ซับซ้อน (เช่น LINE Rich Menu) การสั่งให้ AI สร้างทุกอย่างในครั้งเดียว (Bundle request) มักจะได้ผลลัพธ์ที่มีตัวอักษรผิดเพี้ยน (AI Gibberish) หรือองค์ประกอบวางทับซ้อนกันไม่สวยงาม 

เทคนิค **"Layered Generation"** พิสูจน์แล้วว่าให้ผลลัพธ์ที่ **สวยงาม** และ **แม่นยำ** ที่สุด:

### Step 1: Base Background Generation
- **Focus**: สร้างบรรยากาศ (Ambient), แสงสี (Lighting), และพื้นผิว (Texture) ตามธีมที่ต้องการ (เช่น Morning Mystic)
- **Goal**: ได้พื้นหลังที่คลีนและคุมโทน เพื่อใช้เป็นฐานราก (Foundation)
- **Prompt Logic**: เน้นวัสดุและอารมณ์ (เช่น Glassmorphism, silk, soft lights)

### Step 2: Icon Injection (Image-to-Image)
- **Focus**: นำรูปจาก Step 1 ไปเป็น Reference แล้วสั่งให้ AI "เติม" ไอคอนลงไปในตำแหน่งที่กำหนด
- **Strategy**: 
    - ห้ามใส่ตัวอักษรในขั้นตอนนี้เด็ดขาด เพื่อเลี่ยง AI Hallucination
    - ระบุสไตล์ไอคอนให้ชัดเจน (เช่น Gold Line-art, minimal)
    - กำหนด Grid Layout (เช่น 3x2) เพื่อให้ไอคอนวางตรงตำแหน่งปุ่ม
- **Prompt Logic**: "Using the attached background... add [icons] to centers of [cells]... NO TEXT."

### Step 3: Manual Text Layering
- **Focus**: นำรูปพื้นหลังที่มีไอคอนแล้ว มาใส่ตัวหนังสือ (Labels) เองในซอฟต์แวร์ออกแบบ หรือกำหนดผ่าน UI Code
- **Goal**: เพื่อความแม่นยำ 100% ในเรื่องภาษา (Font), ขนาด (Size), และความอ่านง่าย (Accessibility)

## 🛡️ Oracle Insight
เทคนิคนี้ลดการ "เสี่ยงโชค" กับ AI และทำให้เราสามารถควบคุม **Branding Consistency** ได้ดีกว่าการใช้ AI แบบ All-in-one เป็นหัวใจสำคัญของการสร้าง **MimiVibe Style** ให้ดูแพงและเป็นมืออาชีพ

**Apply When**: สร้าง Rich Menu, Cover Image, หรือ UI Cards ที่มีข้อมูลซับซ้อน
**Tags**: `branding` `image-generation` `gemini-technique` `ui-design` `mmv-tarots`
