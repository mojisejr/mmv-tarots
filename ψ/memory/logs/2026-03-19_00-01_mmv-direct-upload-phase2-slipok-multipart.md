---
type: snapshot
project: mmv-tarots
task_id: "#mmv-direct-upload-rounded-price-ppp-2026-03"
status: active
tags: [snapshot, mmv-tarots, payment, slipok, direct-upload, multipart, phase2]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/lib/server/services/slip-verification-service.ts
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/services/slip-verification-service.test.ts
  - /Users/non/dev/opilot/ψ/memory/logs/mmv-tarots/2026-03-18_23-28_mmv-direct-file-upload-rounded-price-plan.md
---

# Snapshot: MMV Direct Upload Phase 2 SlipOK Multipart Adapter

**Time**: 2026-03-19 00:02 +0700
**Context**: `ggg` Phase 2 สำหรับแผน direct file upload ของ `mmv-tarots` โดยย้าย SlipOK adapter จาก JSON/base64 mode ไปเป็น multipart `files` mode ตาม provider guide และคง error taxonomy เดิม

## Evidence
- Commit `ff37bf7` เปลี่ยน `slipVerificationService.verify()` ให้สร้าง `FormData` เมื่อมี `slipFile`
- Request contract ใหม่ส่ง `files`, `log`, `amount` ไปยัง `https://api.slipok.com/api/line/apikey/<branchId>` พร้อม header `x-authorization`
- JSON `url` fallback ยังอยู่เพื่อกัน caller อื่น regress ระหว่าง rollout
- Service test ใหม่ assert ว่า `Content-Type` ไม่ถูกบังคับ manual ใน multipart path และ body มีไฟล์จริงพร้อม metadata
- Nested response parsing (`data.success`, `data.amount`, `data.transRef`) และ error mapping `1010/1012/1013/1014` ยังผ่านครบ

## Hard Gate
- `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build` ✅
- `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint` ✅
- `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test` ✅

## Guardrails
- ไม่เก็บ raw slip image ลง log หรือ Oracle memory
- multipart path ใช้เฉพาะเมื่อมี `slipFile`; route/service ชั้นบนยังไม่ต้องรู้เรื่อง storage URL
- Error semantics ฝั่ง payment surface ต้องคง deterministic contract เดิมจนกว่าจะเริ่ม Phase 3 UX

## Next Actions
1. เดิน Phase 3: เปลี่ยน `PromptPayQR`/payment modal เป็น file picker + preview + multipart submit
2. เพิ่ม component test สำหรับ direct upload UX และ Thai error copy
3. manual smoke บน iPhone/Android เมื่อ UI path พร้อม

## Tags
`snapshot` `mmv-tarots` `payment` `slipok` `direct-upload` `multipart` `phase2`