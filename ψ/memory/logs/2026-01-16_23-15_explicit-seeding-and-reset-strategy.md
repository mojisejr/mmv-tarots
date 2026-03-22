# Snapshot: Explicit Seeding & Safe Hard Reset Strategy

**Time**: 2026-01-16 23:15 GMT+7
**Context**: ปฏิรูปกระบวนการ Seeding และ Reset ฐานข้อมูลเพื่อความปลอดภัยสูงสุดก่อน Launch Production โดยเน้นการรักษาจิตวิญญาณของแม่หมอ (Agent Prompts)

## 1. The "Spirit Preservation" Decision
จากการวิเคราะห์ความเสี่ยง เราตัดสินใจ **ไม่ให้** กระบวนการ Seeding หรือ Hard Reset ทำการลบหรือเขียนทับข้อมูลในตาราง `AgentConfig` โดยไม่ตั้งใจ
- **เหตุผล**: Agent Prompts (Gatekeeper, Analyst, Mystic) คือหัวใจของระบบที่ผ่านการจูน (Fine-tune) มาแล้ว การทำ Auto-update ทุกครั้งที่รัน `seed` มีความเสี่ยงที่จะนำโค้ดเก่าไปทับข้อมูลปัจจุบันใน Database
- **ผลลัพธ์**: เปลี่ยน Logic จาก "Upsert" เป็น **"Create Only if Not Exists"** เพื่อความปลอดภัย 100%

## 2. Hard Reset & Seeding Architecture
เราได้แยกสคริปต์การทำงานออกเป็น 2 ระดับ:

- **Unified Master Seed** (`prisma/seed.ts`): 
  - ใช้สำหรับ Setup Master Data (Cards, Packages, Suggested Questions)
  - จะข้ามการสร้าง Agent หากมีข้อมูลอยู่แล้ว

- **Hard Reset Script** (`scripts/hard-reset-and-seed.ts`):
  - **Cleanup**: ล้างข้อมูล Users, Transactions, Predictions และ Master Data อื่นๆ
  - **Preservation**: จงใจยกเว้นตาราง `AgentConfig` ไม่ให้ถูกลบ
  - **Safety**: บังคับให้พิมพ์คำสั่งยืนยัน และเช็ค Environment (โดยเฉพาะใน Production)
  - **Privacy**: ไฟล์นี้ถูกเพิ่มลงใน `.gitignore` เพื่อไม่ให้หลุดขึ้น Repo

## 3. Explicit Update Protocol
สำหรับการอัปเดต Prompt ในอนาคต จะต้องทำผ่านสคริปต์เฉพาะตัว (Explicit Update) เช่น `update-gatekeeper-prompt.ts` เท่านั้น เพื่อให้มนุษย์เป็นคนตัดสินใจว่าจะ Deploy Prompt ใหม่ ณ เวลาใด

## 4. Knowledge Patterns
- **Pattern**: "Configuration as Code, State as Database" เมื่อ Configuration (Prompts) เริ่มมีความเป็น State สูงกว่า Code ให้เปลี่ยนจาก Auto-sync เป็น Explicit-sync
- **Safety**: การใส่ Interative Prompt ในสคริปต์ทำลาย (Destructive Scripts) เป็นมาตรฐานขั้นต่ำที่ Oracle ต้องรักษาไว้เสมอ

## Tags
`mmv-tarots` `seeding` `hard-reset` `data-security` `best-practices` `explicit-intent`
