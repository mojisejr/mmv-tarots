# Snapshot: Low Latency Discovery (India-Singapore Link)

**Time**: 2026-01-19 13:35
**Context**: รับแจ้งปัญหาจากเพื่อนของคุณนนท์ในประเทศอินเดียว่าเข้าเว็บ mmv-tarots (Vercel) ได้ช้ามาก และต้องใช้ VPN ถึงจะเข้าได้เสถียร

## Insight

ปัญหาความล่าช้า (Latency) และการเชื่อมต่อที่ผิดปกติ มีสาเหตุหลักมาจาก:
1.  **Region Mismatch**: หาก Vercel Function อยู่ที่ US (Default) ข้อมูลต้องวิ่งข้ามทวีป 2 รอบ (India -> US -> SG -> US -> India)
2.  **Routing Topology**: เส้นทางอินเทอร์เน็ตจากอินเดียไปสิงคโปร์อาจถูก Route ไปทางยุโรป (Suboptimal BGP Routing) ทำให้ Latency พุ่งสูง
3.  **ISP Throttling**: ผู้ให้บริการในอินเดียอาจมีการจำกัดความเร็วหรือมีปัญหา DNS กับ Vercel Edge จนต้องพึ่งพา VPN เพื่อเปลี่ยนเส้นทางข้อมูล (Gateway)
4.  **Transaction Heavy**: Better Auth `user.create.after` มี Load งานใน DB สูง (Referral, Wallet, IP Logs) ซึ่งขยายปัญหา Latency ให้ชัดขึ้น

## Apply When

- เมื่อต้องการวางแผนปรับปรุง Performance สำหรับ User ต่างประเทศ
- เมื่อต้องตัดสินใจเรื่องการทำ Multi-region หรือการย้าย Function Location
- เมื่อวิเคราะห์ปัญหาการเข้าถึง (Accessibility) จาก ISP ในบางประเทศ

## Tags

`latency` `routing` `vercel` `india` `mmv-tarots` `auth`
