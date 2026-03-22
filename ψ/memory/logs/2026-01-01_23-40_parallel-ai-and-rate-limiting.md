# Snapshot: Parallel AI & Rate Limiting Optimization

**Time**: 2026-01-01 23:40
**Context**: Optimizing `mmv-tarots` workflow performance and resource management on Vercel.

## Insight

1.  **Parallel AI Execution**: การเปลี่ยน Workflow จาก Sequential เป็น Parallel สำหรับ Agent ที่ไม่ขึ้นต่อกัน (Gatekeeper & Analyst) โดยใช้ `Promise.all` ช่วยลด Latency รวมของระบบลงได้ 2-3 วินาที ซึ่งสำคัญมากสำหรับ Serverless Environment ที่มี Execution Timeout จำกัด
2.  **Rate Limiting (Cooldown)**: การกำหนด Cooldown 2 นาทีต่อผู้ใช้ (เช็คจาก DB `createdAt`) เป็น "Sweet Spot" ที่ช่วย:
    - ป้องกันการ Spam ที่จะผลาญโควตา Gemini Free Tier
    - ลดภาระ Database Connection
    - สร้าง UX ที่ดีขึ้นในเชิงศาสตร์พยากรณ์ (ทำให้การดูไพ่แต่ละครั้งมีความหมาย)

## Apply When

- เมื่อมี AI Agents หลายตัวใน Workflow ที่ Input ไม่ขึ้นต่อกัน
- เมื่อต้องการป้องกัน Resource Exhaustion ในระบบที่ใช้ Free Tier Services (Gemini, Neon, Vercel)
- เมื่อต้องการสร้าง "จังหวะ" (Pacing) ให้กับ User Experience

## Tags

`performance` `parallel-processing` `rate-limiting` `ux-design` `resource-management`
