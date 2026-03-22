# Snapshot: Intl Latency & Free Tier "Time Ceiling" Analysis

**Time**: 2026-01-21 15:22
**Context**: วิเคราะห์ปัญหาผู้ใช้งานต่างประเทศ (International Users) ติดค้างที่หน้า Loading ระหว่างขั้นตอน Login (Better Auth) แม้ว่าระบบจะได้รับการปรับปรุงให้เป็น Non-blocking แล้วก็ตาม

## Insight

ปัญหา "ค้างหน้า Loading" สำหรับผู้ใช้นอกโซนเอเชียตะวันออกเฉียงใต้ เกิดจากสภาวะ **"Cumulative Latency" (ความหน่วงสะสม)** จนชนเพดานของระบบ:

1.  **Vercel Hobby "Hard Limit"**: แพลน Hobby มี Maximum Execution Duration เพียง **10 วินาที** หากกระบวนการ OAuth ไม่เสร็จสิ้นภายในเวลานี้ Vercel จะตัดการเชื่อมต่อทันที
2.  **The Double Cold Start**:
    *   **Vercel Serverless (1-2s)**: ปลุกฟังก์ชันในสิงคโปร์ (`sin1`)
    *   **Neon Database (2-3s)**: ปลุกฐานข้อมูล Free Tier จากสถานะ Autosuspension (Scale to Zero)
3.  **Cross-Continent Roundtrips**: กระบวนการ Auth ต้องมีการแลกเปลี่ยนข้อมูลระหว่าง User (เช่น US/EU) -> Vercel (Singapore) -> OAuth Provider (LINE/Google) หลายครั้ง ความหน่วงของระยะทาง (RTT) ทำให้เวลารวมพุ่งขึ้นสูงมาก
4.  **Local vs Intl Reality**: ผู้ใช้ในไทยรอดเพราะ Network Delay ต่ำมาก (<500ms) ทำให้เวลารวมไม่เกิน 10 วินาที แต่ผู้ใช้ต่างชาติมักจะชนขีดจำกัด 10 วินาทีพอดี ทำให้ระบบขาดความเสถียร (Flaky)

## Apply When

- เมื่อต้องการตัดสินใจอัปเกรด Infrastructure (เช่น Vercel Pro หรือ Neon Paid Tier)
- เมื่อวิเคราะห์ปัญหา UX สำหรับตลาด Global
- เมื่อวางแผนทำ Multi-region support ในอนาคต

## Tags

`latency` `vercel` `neon` `auth` `free-tier-limits` `mmv-tarots` `better-auth`
