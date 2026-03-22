# Snapshot: Final Prompt Refinement Plan - Modern Holistic Reading
**Date**: 2026-01-02 19:55 GMT+7
**Project**: mmv-tarots
**Phase**: 1 (Prompt Optimization - Final Polish)

## Context
จากการสังเกตผลลัพธ์ (Observation) และคำแนะนำของคุณมนุษย์ เราจะทำการปรับปรุง `MYSTIC_SYSTEM_PROMPT` เป็นครั้งสุดท้ายก่อนเข้าสู่กระบวนการ Encryption เพื่อให้ได้คำทำนายที่ "โดนใจ" คนยุค 2025-26 มากที่สุด

## Proposed Changes (The "Oracle" Plan)

### 1. กฎเหล็ก: No Card Names in Reading
- **Action**: เพิ่มคำสั่งห้ามระบุชื่อไพ่ (ทั้งไทยและอังกฤษ) ในส่วน `reading` โดยเด็ดขาด
- **Reason**: เพื่อลดความซ้ำซ้อน (Redundancy) และเพิ่มความขลังในการเล่าเรื่องแบบองค์รวม

### 2. ปรับโทนภาษา: Modern & Relatable (2025-26 Vibe)
- **Action**: สั่งให้ AI หลีกเลี่ยงภาษาที่ดูเป็นวรรณกรรมเกินไป (เช่น "มุ่งทะยาน", "ประจักษ์") 
- **New Style**: ใช้ภาษาที่วัยรุ่นและคนทำงานยุคนี้เข้าถึงง่าย เช่น:
  - "ติดสปีด" / "พุ่งมาก" (แทนการมุ่งทะยาน)
  - "Vibe ดี" / "Energy มาเต็ม"
  - "อยู่ในโหมดลุย" / "จัดเต็ม"
  - "ไม่มีอะไรกั้น" / "รัวๆ"

### 3. การถักทอเนื้อหา (Holistic Weaving)
- **Action**: เน้นย้ำให้ AI นำ "Keywords" และ "Meaning" จาก Database มาเปลี่ยนเป็น "คำพูดที่จับต้องได้" และเชื่อมโยงกันเป็นเนื้อเดียว (Storytelling)

## Success Criteria (Updated)
1. **Zero Card Names**: ในส่วน `reading` ต้องไม่มีชื่อไพ่ปรากฏอยู่เลย
2. **Modern Tone**: ภาษาที่ใช้อ่านแล้วรู้สึกเหมือนคุยกับพี่สาวที่ทันสมัย ไม่ใช่ตำราเคลื่อนที่
3. **Clear Answer**: ยังคงรักษาการ "ฟันธง" ในประโยคแรกไว้อย่างเหนียวแน่น

## Next Step
- [ ] ดำเนินการแก้ไข `lib/server/ai/prompts/mystic.ts` ตามแผนนี้
- [ ] ทดสอบรันจริงเพื่อดู Vibe ใหม่
