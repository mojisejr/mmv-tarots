# Snapshot: mmv-tarots Pre-Production Handover

**Time**: 2026-01-16 13:35 GMT+7
**Context**: นายท่าน (User) กำลังจะไปเตรียมข้อมูลและจัดการ Stripe Production ก่อนจะกลับมาทำ Master Seeder ต่อ

## 1. Current Progress Recap
- **Phase 5 Complete**: ระบบ Onboarding (Welcome Ritual) และ Suggested Questions เสร็จสมบูรณ์
- **Production Readiness**: โค้ดพร้อมประมาณ 95%, รอการสลับ Keys และการทำ Master Seed บนระบบจริง
- **Stripe Setup**: นายท่านได้สร้าง Product ใน Stripe Dashboard (Live Mode) เรียบร้อยแล้ว

## 2. Pending Knowledge (สิ่งที่ต้องเตรียมกลับมา)
- **Live Price IDs**: รายการ `price_...` สำหรับ Starter, Standard, และ Premium (ทั้ง Regular และ Promo)
- **Stripe Live Keys**: `SK_LIVE`, `PK_LIVE`, และ `Webhook Secret` สำหรับ Production ENV

## 3. Road Ahead: The Master Seeder
เมื่อกลับมา เราจะสร้าง **Unified Master Seed Script** (`prisma/seed.ts`) ที่จะทำหน้าที่:
1. **Clean Data**: เคลียร์ Master Data เก่า (Cards, Packages, Prices, AgentConfigs, SuggestedQuestions)
2. **Re-Seed Cards**: โหลดไพ่ 78 ใบจาก CSV
3. **Re-Seed Packages**: ใส่ราคาจริงจาก Price IDs ที่เตรียมมา
4. **Re-Seed Agents**: โหลด Encrypted Prompts จาก Source Code
5. **Add Newness**: เพิ่ม Suggested Questions สำหรับช่วย User เริ่มต้นถาม

## 4. Next Session Trigger
- ทันทีที่กลับมา: เริ่มต้นที่การรวบรวม Price IDs และเขียนไฟล์ `prisma/seed.ts`

## Tags
`mmv-tarots` `handover` `production-ready` `master-seeder` `stripe-live`
