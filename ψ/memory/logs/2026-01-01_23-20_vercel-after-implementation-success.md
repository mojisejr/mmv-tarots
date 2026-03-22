# Snapshot: Vercel after() Implementation Success

**Time**: 2026-01-01 23:20
**Context**: Fixing prediction failure on Vercel due to function suspension and Prisma transaction timeout.

## Insight

การใช้ `after()` ใน Next.js 15/16 เป็นทางเลือกที่ยอดเยี่ยมสำหรับกระบวนการแบบ Fire-and-forget บน Vercel เพราะช่วยให้เราส่ง Response กลับหาผู้ใช้ได้ทันที (Low Latency) ในขณะที่ยังรับประกันว่า Serverless Function จะไม่ถูกแช่แข็ง (Suspended) จนกว่างานเบื้องหลัง (Background Task) จะเสร็จสิ้น สิ่งนี้ช่วยแก้ปัญหา Prisma Transaction Timeout (`P2028`) ที่เกิดจากการที่กระบวนการถูกหยุดกลางคันได้โดยตรง

## Apply When

- เมื่อต้องการรัน Background Task ที่ใช้เวลานาน (เช่น AI Generation, Email Sending) บน Vercel
- เมื่อต้องการรักษา UX แบบ Fire-and-forget (ส่ง Job ID ทันที) แต่ต้องการความเสถียรของ Database Transaction
- เมื่อใช้ Next.js 15 ขึ้นไป และต้องการหลีกเลี่ยงความซับซ้อนของการตั้งค่า Edge Runtime หรือ External Queue

## Tags

`nextjs-16` `vercel` `after-function` `prisma-timeout` `background-tasks`
