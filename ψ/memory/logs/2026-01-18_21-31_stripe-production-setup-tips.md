# Snapshot: Stripe Production Setup & Versioning Insights

**Time**: 2026-01-18 21:31
**Context**: การเตรียมความพร้อมสำหรับระบบชำระเงินจริง (Live Mode) ของ mmv-tarots

## Insight

การย้ายจาก Local Webhook ไปสู่ Real Webhook บน Production มีจุดสำคัญที่ต้องจำ 3 ประการ:

1.  **Webhook Migration**: เมื่อขึ้น Production ต้องเลิกใช้ `stripe listen` และไปจอง Endpoint จริงใน Stripe Dashboard เพื่อรับเลข `whsec_...` (Signing Secret) ใหม่ที่ใช้เฉพาะใน Live Mode เท่านั้น
2.  **API Version Alignment**: ในโค้ดมีการล็อคเวอร์ชันไว้ที่ `2025-12-15.clover` (เช่น `new Stripe(key, { apiVersion: '2025-12-15.clover' })`) หากเวอร์ชันใน Dashboard ของ Stripe ใหม่กว่า อาจทำให้การตรวจสอบ Signature ล้มเหลวได้ ต้องหมั่นเช็คให้ตรงกันเสมอ
3.  **Idempotency Handling**: การเช็ค `existing transaction` ใน Database โดยใช้ `stripeSessionId` เป็นหัวใจสำคัญในการป้องกันการเติม Credit ซ้ำ (Double Crediting) หาก Stripe ส่ง Webhook เดิมมาหลายรอบ

## Apply When

- เมื่อต้องการเปลี่ยนจากระบบทดสอบ (Test Mode) เป็นระบบจริง (Live Mode)
- เมื่อเกิดปัญหา "Webhook Signature Verification Failed" (ให้เช็ค API Version)
- เมื่อวางโครงสร้างระบบชำระเงินในโปรเจกต์ใหม่ๆ ภายใต้ Oracle Framework

## Tags

`stripe` `production` `webhooks` `dev-ops` `versioning` `security`
