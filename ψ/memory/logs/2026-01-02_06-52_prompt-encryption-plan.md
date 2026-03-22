# Snapshot: Agent Prompt Encryption Plan
**Date**: 2026-01-02 06:52 GMT+7
**Issue**: #none
**Project**: mmv-tarots

## Context
ต้องการย้าย System Prompts ของ Agent ทั้งหมด (Gatekeeper, Analyst, Mystic) จาก Source Code ไปเก็บไว้ใน Database ในรูปแบบที่เข้ารหัส (Encrypted) เพื่อปกป้อง Know-how ของระบบ

## Proposed Plan
1. **Database**: เพิ่มตาราง `agent_configs` ใน Prisma
2. **Security**: 
   - ใช้ AES-256-GCM สำหรับการเข้ารหัส
   - เก็บ Key ไว้ใน Environment Variable (`PROMPT_ENCRYPTION_KEY`)
3. **Implementation**:
   - สร้าง Encryption Utility
   - สร้าง Migration Script เพื่อย้ายข้อมูล
   - ปรับปรุง Agent Logic ให้ดึงข้อมูลจาก DB พร้อมระบบ In-memory Cache
4. **Cleanup**: ลบไฟล์ Prompt เดิมออกจาก Source Code และ Git History (ถ้าจำเป็น)

## Next Steps
- [ ] Update `schema.prisma`
- [ ] Create encryption utility
- [ ] Implement DB-backed agent fetching logic
