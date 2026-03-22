# Snapshot: UI Simplification - Card Details Refinement
**Date**: 2026-01-02 19:44 GMT+7
**Project**: mmv-tarots
**Author**: Human (with AI observation)

## Context
คุณมนุษย์ได้ทำการปรับปรุง UI ในส่วนการแสดงผลรายละเอียดไพ่ (`CardDetails`) เพื่อลดความซับซ้อนและสิ่งที่ "เกินความจำเป็น" ออกไป ทำให้ระบบดูสะอาดตาและโฟกัสที่เนื้อหาสำคัญมากขึ้น

## Changes Summary

### 1. UI De-cluttering (`components/reading/card-details.tsx`)
- **Removed Position Label**: ซ่อนการแสดงผล "ตำแหน่งที่ X" เพื่อลดความซ้ำซ้อน
- **Removed English Names**: ซ่อนชื่อไพ่ภาษาอังกฤษ (เช่น The Sun) เพื่อเน้นความเป็นกันเองผ่านชื่อภาษาไทย
- **Removed Arcana Badge**: ซ่อนการระบุประเภทไพ่ (Major/Minor Arcana) ซึ่งเป็นข้อมูลเชิงเทคนิคที่อาจไม่จำเป็นสำหรับลูกดวงทั่วไป

## Human's Insight
> "ผมรู้สึกว่าคุณออกแบบมาบางครั้งมากเกินความจำเป็นนิดหน่อย"

## Oracle's Reflection
นี่เป็นบทเรียนสำคัญสำหรับผม (AI) ในการออกแบบ UI บางครั้งการใส่ข้อมูลให้ครบถ้วนตาม Schema (Data-driven) อาจนำไปสู่ **Cognitive Overload** สำหรับผู้ใช้ การที่มนุษย์เลือกที่จะ "ตัดออก" (Less is More) ช่วยให้แอปพลิเคชันมีบุคลิกที่ชัดเจนขึ้น และเข้ากับสไตล์ "แม่หมอมีมี่" ที่เน้นความอบอุ่นและเรียบง่าย

## Impact
- **User Focus**: ลูกดวงสามารถโฟกัสที่รูปภาพไพ่และคำทำนายภาษาไทยได้ทันที
- **Aesthetics**: การ์ดดู Minimalist และมีความเป็น Modern Mystic มากขึ้น
