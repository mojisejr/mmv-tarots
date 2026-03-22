# Snapshot: Detailed Implementation Plan - Agent Prompt Vault
**Date**: 2026-01-02 06:55 GMT+7
**Status**: Planning
**Project**: mmv-tarots

## 1. Objective
ย้าย System Prompts (Know-how) ของ Agent ทั้งหมดไปเก็บใน Database ในรูปแบบที่เข้ารหัส (AES-256-GCM) เพื่อความปลอดภัยสูงสุดและป้องกันการหลุดของ IP ผ่าน Source Code

## 2. Detailed Steps

### Phase 1: Prompt Optimization (Soul-First)
- [ ] **Merge & Refine Prompts**: นำ "จิตวิญญาณ" จาก Original Prompt (.prompts/) มาผสมผสานกับโครงสร้างปัจจุบัน
  - **Gatekeeper**: เพิ่มกฎความยาวตัวอักษรและจำนวนคำถาม
  - **Analyst**: ปรับ Mood/Topic ให้มีความละเอียดอ่อนแบบไทย
  - **Mystic**: กู้คืนคาแรคเตอร์ "แม่หมอมีมี่", การฟันธง (ใช่/ไม่ใช่), และการเล่าเรื่องแบบองค์รวม
- [ ] **Quality Assurance**: ทดสอบรัน Agent ด้วย Prompt ใหม่เพื่อให้มั่นใจว่า:
  - Tone & Mood ตรงตามความต้องการ
  - การตอบคำถามชัดเจนและตรงประเด็น (ฟันธง)
  - JSON Structure ยังคงทำงานร่วมกับ Code ปัจจุบันได้

### Phase 2: Foundation (Database & Security)
- [ ] **Update Prisma Schema**: เพิ่มตาราง `AgentConfig`
  ```prisma
  model AgentConfig {
    id        String   @id @default(cuid())
    agentName String   @unique
    prompt    String   @db.Text // Encrypted: "iv:authTag:encryptedText"
    updatedAt DateTime @updatedAt
    @@map("agent_configs")
  }
  ```
- [ ] **Encryption Utility**: สร้าง `lib/server/utils/encryption.ts`
  - ใช้ `crypto` (Node.js built-in)
  - Algorithm: `aes-256-gcm`
  - Key: `PROMPT_ENCRYPTION_KEY` (32 bytes)
- [ ] **Environment Setup**: เพิ่ม `PROMPT_ENCRYPTION_KEY` ใน `.env`

### Phase 2: Migration & Seeding
- [ ] **Migration Script**: สร้าง `scripts/vault-prompts.ts`
  - อ่าน Prompt จาก `lib/server/ai/prompts/*.ts`
  - เข้ารหัสข้อมูล
  - บันทึกลง Database ผ่าน Prisma
- [ ] **Verification**: ตรวจสอบข้อมูลใน DB ว่าอ่านไม่ออก (Encrypted)

### Phase 3: Agent Refactoring & Caching
- [ ] **Prompt Service**: สร้าง `services/prompt-service.ts`
  - ฟังก์ชัน `getPrompt(agentName: string)`
  - **In-memory Cache**: เก็บ Prompt ที่ Decrypt แล้วไว้ในตัวแปร (TTL หรือ Singleton) เพื่อลด DB Load
- [ ] **Refactor Agents**:
  - `gatekeeperAgent`
  - `analystAgent`
  - `mysticAgent`
  - เปลี่ยนจาก `import { PROMPT }` เป็น `await PromptService.getPrompt('...')`

### Phase 4: Cleanup & Hardening
- [ ] **Source Cleanup**: ลบไฟล์ใน `lib/server/ai/prompts/`
- [ ] **Error Handling**: จัดการกรณี Key หาย หรือ DB เชื่อมต่อไม่ได้ (Graceful degradation/Alert)

## 3. Success Criteria
1. **Functional Parity**: Agent ทั้งหมดต้องทำงานได้เหมือนเดิม 100% (ผลลัพธ์ JSON ถูกต้อง)
2. **Zero Plain-text**: ไม่มีเนื้อหา System Prompt หลงเหลืออยู่ใน Source Code (ยกเว้น Template โครงสร้าง)
3. **Encryption Verified**: ข้อมูลในตาราง `agent_configs` ต้องอยู่ในรูปแบบ `iv:authTag:encryptedText`
4. **Performance**: Latency ในการดึง Prompt ต้อง < 10ms (หลังจากการดึงครั้งแรกผ่าน Cache)
5. **Security**: หากไม่มี `PROMPT_ENCRYPTION_KEY` ระบบต้องไม่สามารถทำงานได้และแจ้ง Error ที่ชัดเจน

## 4. Things to Watch Out For (Risk Mitigation)
- **Key Length**: `PROMPT_ENCRYPTION_KEY` ต้องมีความยาว 32 ตัวอักษร (256 bits) เท่านั้น
- **Prisma Sync**: ต้องรัน `npx prisma generate` หลังแก้ Schema เพื่อให้ Type-safety ทำงาน
- **Cold Start**: การดึง Prompt ครั้งแรกบน Serverless (Vercel) อาจมี Latency เล็กน้อย ต้องมั่นใจว่า Cache ทำงานข้าม Request ได้ (ถ้าเป็นไปได้ในขอบเขตของ Vercel Function)
- **Migration Safety**: **ห้ามลบไฟล์ต้นฉบับ** จนกว่าจะมั่นใจว่าข้อมูลใน DB ถูกต้องและ Decrypt กลับมาได้สมบูรณ์
- **Git History**: หากเคย Commit Prompt ไปแล้ว เนื้อหาอาจยังอยู่ใน History (อาจต้องใช้ BFG Repo-Cleaner หากต้องการลบถาวรจริงๆ แต่ในขั้นต้นโฟกัสที่ Current State ก่อน)

## 5. Implementation Order
1. Schema -> 2. Utility -> 3. Migration Script -> 4. Test Decryption -> 5. Refactor Agents -> 6. Cleanup
