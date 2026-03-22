# Snapshot: Explicit Seeding & Hard Reset Strategy

**Time**: 2026-01-16 GMT+7
**Context**: การออกแบบระบบจัดการข้อมูล Master Data และการทำความสะอาดฐานข้อมูล (Data Hygiene) ให้ปลอดภัยสำหรับการทำงานร่วมกับข้อมูล Production ที่จูนละเอียด (Fine-tuned Prompts)

## 1. The "Explicit Only" Strategy for AI Prompts
เราตัดสินใจ **ไม่ใช้ Auto-Upsert** สำหรับตาราง `AgentConfig` ใน Seed Scripts เพื่อป้องกันอุบัติเหตุการทับข้อมูล Prompt ที่จูนไว้ใน Database (ซึ่งอาจจะใหม่กว่าหรือละเอียดกว่าโค้ด) 

### กลไกความปลอดภัย:
- **Seed & Hard Reset**: เปลี่ยนเป็นโหมด **"Create Only"** (จะสร้างก็ต่อเมื่อไม่มีข้อมูลอยู่แล้วเท่านั้น)
- **Manual Control**: หากต้องการอัปเดต Prompt จริงๆ จะต้องเรียกใช้ Explicit Update Scripts (เช่น `update-gatekeeper-prompt.ts`) แยกต่างหาก เพื่อความมั่นใจ 100% ว่านี่คือความตั้งใจของมนุษย์

## 2. Hard Reset & Seeding (DANGER ZONE)
สร้างสคริปต์ [scripts/hard-reset-and-seed.ts](projects/mmv-tarots/scripts/hard-reset-and-seed.ts) เพื่อรองรับการเตรียมระบบสู่ Production (Clean State):
- **Wipe Logic**: ลบข้อมูลทุกอย่าง (Users, Transactions, Predictions, Master Data) ยกเว้น `AgentConfig` ที่เลือกจะรักษาไว้ (Preserve)
- **Interactive Guard**: มีระบบถามยืนยัน (`yes`) ในระดับ development และต้องการคำยืนยันพิเศษ (`DESTROY PRODUCTION DATA`) หากตรวจพบว่าอยู่ในโหมด Production
- **Git Security**: ไฟล์สคริปต์นี้จะไม่ถูก Commit ขึ้น Repository (อยู่ใน `.gitignore`) เพื่อป้องกันความผิดพลาดระดับวิกฤต

## 3. Configuration Management
- ข้อมูลราคาและแพ็กเกจ (Price IDs) ถูกดึงจาก [.tmp/master-seed-config.json](projects/mmv-tarots/.tmp/master-seed-config.json)
- ข้อมูลไพ่ 78 ใบยังคงความสมบูรณ์โดยดึงจาก `docs/card.csv` ทุกครั้งที่มีการรัน Seeding

## 4. Key Decisions & Rationale
- **Decision**: แยก `hard-reset` ออกจาก `seed` ปกติ
  - **Why**: เพื่อให้การรัน `prisma db seed` ทั่วไปมีความเสี่ยงต่ำและใช้สำหรับการเพิ่มข้อมูลใหม่โดยไม่ทำลายข้อมูลเดิม
- **Decision**: ใช้ `findUnique` เช็คก่อน `create` แทนการใช้ `upsert`
  - **Why**: เพื่อให้มนุษย์เป็นผู้มีอำนาจสูงสุด (Final Authority) ในการอัปเดตหัวใจของระบบ (Prompts)

## Tags
`mmv-tarots` `seeding-strategy` `data-safety` `hard-reset` `agent-configs` `production-setup`
