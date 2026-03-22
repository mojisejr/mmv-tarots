# Snapshot: Mimi Focus Mode Positioning Issue
**Date**: 2026-01-05 07:17
**Project**: mmv-tarots
**Issue ID**: #none

## Context
พยายามเพิ่ม "Focus Mode" ในหน้าแรก (`app/page.tsx`) โดยเมื่อ User กด Focus ที่ `QuestionInput` จะมี `MimiLoadingAvatar` ลอยขึ้นมาตรงกลางหน้าจอพร้อมพื้นหลัง Blur เพื่อสร้างบรรยากาศการสื่อสารกับ Mimi

## The Problem
- **Positioning Drift**: ในโหมด Focus ตัว Avatar มักจะกระโดดไปชิดมุมซ้ายบน (Top-Left) ทั้งบน Mobile และ Desktop
- **Inconsistency**: แม้จะพยายามใช้ `fixed inset-0` ร่วมกับ `flex items-center justify-center` หรือ `absolute left-1/2 top-1/2` แล้ว แต่ Browser ยังคำนวณจุดศูนย์กลางผิดพลาดเมื่อมีการใช้ `transition-transform` (translate/scale) ร่วมด้วย
- **Layout Conflict**: พื้นที่ของ Navbar (`pt-16/20`) และ Safe Area บนมือถืออาจมีส่วนทำให้การคำนวณ `fixed` หรือ `absolute` คลาดเคลื่อน

## Attempted Fixes
1.  ใช้ `fixed inset-0` + `flex` -> ล้มเหลวในบางหน้าจอ (ชิดซ้ายบน)
2.  ใช้ `absolute inset-0` ภายใน Container ที่หักลบ Navbar แล้ว -> ดีขึ้นในหน้าปกติ แต่พังในหน้า Focus
3.  ใช้ `absolute left-1/2 top-1/2` + `translate-x/y-1/2` -> ยังคงมีปัญหาชิดซ้ายบนในบางสภาวะ

## Current State
- ถอดโค้ดส่วน Focus Mode ออกชั่วคราวเพื่อรักษาความเสถียรของ UI
- หน้าแรกกลับมาแสดงผล Mimi ในสถานะ Idle (กึ่งกลางหน้าจอ) ได้ถูกต้องแล้ว
- เก็บ `isInputFocused` state ไว้ใน `app/page.tsx` และ `onFocus/onBlur` ใน `QuestionInput` เพื่อรอการแก้ไขต่อในอนาคต

## Next Steps (For Afternoon Session)
- วิเคราะห์การใช้ `transform-origin` และการซ้อนทับของ CSS Transitions
- พิจารณาใช้ `AnimatePresence` จาก Framer Motion แทนการใช้ Tailwind Transitions เพื่อการควบคุมตำแหน่งที่แม่นยำกว่า
- ตรวจสอบว่ามี Global CSS ตัวไหนที่ไป Override `left-1/2` หรือ `top-1/2` หรือไม่
