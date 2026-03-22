# Snapshot: Cooldown Timer UX/UI Implementation Plan

**Time**: 2026-01-01 23:44
**Context**: Planning the transition from a simple error-based rate limit to a proactive UI-based cooldown timer for `mmv-tarots`.

## Insight

การเปลี่ยนจาก Error Message (Reactive) เป็น Countdown Timer (Proactive) ช่วยลดความหงุดหงิดของผู้ใช้และสร้างความเข้าใจในกฎกติกาของระบบได้ดีกว่า โดยเฉพาะในแอปพลิเคชันแนวพยากรณ์ที่ต้องการ "จังหวะ" ในการใช้งาน

## Implementation Plan (No Schema Update Required)

### 1. Backend (API Layer)
- **`app/api/predict/route.ts`**: คำนวณ `retryAfter` (วินาที) โดยอ้างอิงจาก `createdAt` ล่าสุดในตาราง `predictions` และส่งกลับไปใน Error Details เมื่อติด Rate Limit
- **`app/api/user/me/route.ts`**: ดึงข้อมูล `createdAt` ล่าสุดจากตาราง `predictions` ของ User นั้นๆ และส่งกลับไปในฟิลด์ `lastPredictionAt` เพื่อให้ Frontend ทราบสถานะ Cooldown ทันทีที่โหลดหน้า โดยไม่ต้องเพิ่มฟิลด์ใหม่ใน Database Schema

### 2. Frontend (State & Logic)
- **`lib/client/api.ts`**: อัปเดต Schema และ Types ให้รองรับข้อมูลเวลาทำนายล่าสุด
- **`app/page.tsx`**: 
    - เพิ่ม State `cooldownRemaining`
    - ใช้ `setInterval` เพื่อทำ Countdown Logic
    - ดึงสถานะเริ่มต้นจาก API เมื่อ Mount

### 3. UI Components
- **`components/ui/question-input.tsx`**: 
    - เพิ่ม Prop `cooldownRemaining`
    - Disable Input และปุ่มส่งเมื่อยังมีเวลาเหลือ
    - แสดงข้อความนับถอยหลัง (เช่น "รออีก 1:45 นาที") บนปุ่มแทนไอคอนปกติ

## Apply When

- เมื่อต้องการทำ Rate Limiting ที่มีผลต่อ UX โดยตรง
- เมื่อต้องการลดภาระ Server โดยการป้องกันไม่ให้ User กดส่งคำขอตั้งแต่ต้นทาง (Client-side prevention)

## Tags

`ux-improvement` `cooldown-timer` `rate-limiting` `frontend-logic` `backend-api`
