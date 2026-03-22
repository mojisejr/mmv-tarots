# Snapshot: The Triple Star Glitch & Latency Tradeoffs

**Time**: 2026-01-19 22:00
**Context**: Investigation of multiple star rewards and UI desync in `mmv-tarots` following a latency optimization refactor.

## Insight

การทำ "Latency Optimization" โดยใช้กลยุทธ์ **Fire & Forget** (Parallel/Background Jobs) ในระบบ Auth มีความเสี่ยงสูงหากไม่มีระบบ **Idempotency** และ **State Synchronization** ที่ดีพอ:

1.  **Race Condition (Foreground vs Background)**: เมื่อเราขยายจุดที่สามารถแจกรางวัลได้ (เช่น ทั้งใน Auth Hook และ Onboarding API) โดยไม่มีการเช็คสถานะจากแหล่งความจริง (DB) แบบรัดกุม จะทำให้เกิดการแจกซ้ำ (Double/Triple Rewards)
2.  **Session Stale State**: Better Auth (และระบบ Session ส่วนใหญ่) จะทำ Snapshot ข้อมูลผู้ใช้ไว้ในจังหวะ Login การอัปเดต DB ใน Background หลังจากนั้นจะไม่ส่งผลต่อ Session ที่ Browser ถืออยู่ทันที ทำให้เกิดอาการ UI Desync (หน้าจอโชว์ข้อมูลเก่า)
3.  **Referral Logic Complexity**: การแจกรางวัลให้ "คนใช้" กับ "คนแนะนำ" ในจังหวะที่ต่างกัน (Entry vs Engagement) หากไม่รวบ Logic ไว้ที่จุดเดียวจะทำให้การติดตามสถานะ (PENDING/GRANTED) เกิดความขัดแย้งกับ Transaction Log

## Apply When

- การย้ายงานหนักไปไว้ใน Background (`Promise.allSettled`, Webhooks, MQ)
- การออกแบบระบบ Rewards หรือ Credits ที่มีผลต่อ User Experience ทันที
- เมื่อต้องเลือกระหว่าง "ความเร็วในการโหลด" (Speed) กับ "ความถูกต้องของข้อมูล" (Integrity)

## Tags

`latency-optimization` `idempotency` `race-condition` `state-desync` `referral-system` `mmv-tarots`
