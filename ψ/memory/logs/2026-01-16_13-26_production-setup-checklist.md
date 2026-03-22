# Snapshot: mmv-tarots Production Setup Checklist

**Time**: 2026-01-16 13:26 GMT+7
**Context**: สรุปขั้นตอนสุดท้ายที่มนุษย์ต้องเตรียม (Setup) เพื่อเปิดใช้งาน mmv-tarots ในโหมด Production (Live) อย่างเป็นทางการ

## 1. Stripe Live Setup (Critical)
ก่อนจะรับเงินจริง ต้องเตรียมฝั่ง Stripe ให้พร้อม:
- [ ] **Activate Stripe Account**: ตรวจสอบว่าบัญชี Stripe ผ่านการ Verify และเปิดใช้งาน Live Mode แล้ว
- [ ] **Create Products**: สร้าง Product (Starter, Popular, Pro) ใน Stripe Live Mode ให้ตรงกับชื่อในระบบ
- [ ] **Price IDs**: คัดลอก `price_...` (Live) มาอัปเดตใน `projects/mmv-tarots/scripts/seed-packages.ts`
- [ ] **Live Webhook**: ตั้งค่า Webhook Endpoint ใน Stripe Dashboard ชี้ไปที่ `https://your-domain.com/api/webhooks/stripe` (เลือก event `checkout.session.completed`)

## 2. Environment Variables (Vercel)
อัปเดตค่าเหล่านี้ใน Vercel Dashboard (Production Scope):
- [ ] `STRIPE_SECRET_KEY`: ใช้ค่า `sk_live_...`
- [ ] `STRIPE_PUBLISHABLE_KEY`: ใช้ค่า `pk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET`: ใช้ค่า `whsec_...` ได้จากตอนตั้งค่า Webhook ในข้อ 1
- [ ] `NEXT_PUBLIC_APP_URL`: โดเมนจริง (เช่น `https://mmv-tarots.com`)
- [ ] `DATABASE_URL`: URL ของ Neon Postgres (Production Branch)

## 3. Database Initial Seeding
รันคำสั่งเหล่านี้หลังจาก Deploy ครั้งแรกเพื่อให้ข้อมูลเริ่มต้นครบถ้วน:
1. **Cards**: รัน `npx tsx scripts/import-cards.ts` เพื่อโหลดข้อมูลไพ่ทั้ง 78 ใบ
2. **Packages**: รัน `npx tsx scripts/seed-packages.ts` (ต้องมี Price IDs จากข้อ 1)
3. **AI Agents**: ตรวจสอบว่า Prompts (Gatekeeper, Mystic, Analyst) ถูกโหลดเข้า Database แล้ว (รัน `npx tsx scripts/update-gatekeeper-prompt.ts` เป็นต้น)

## 4. Final Verification
- [ ] **Merge PR #55**: รวมระบบ Welcome Ritual และ Onboarding เข้าสู่ Branch หลัก
- [ ] **Production Build**: รัน `npm run build` เพื่อทดสอบว่าไม่มี Error ในการ Compile
- [ ] **Test Transaction**: ลองซื้อแพ็กเกจจริง (ใช้เงินจริงหรือ Test Mode ที่เปิด Live) เพื่อดูว่า Webhook ทำงานถูกต้องและดาวเพิ่มในบัญชี

## Apply When
- เมื่อพร้อมจะผูกโดเมนจริงและรับผู้ใช้งานทั่วไป
- เมื่อต้องการย้ายจากคลังสำรอง (Test) สู่สนามจริง (Live)

## Tags
`production` `checklist` `stripe-live` `seeding` `deployment`
