---
type: snapshot
project: mmv-tarots
task_id: "#mmv-tarots-mcp-check"
status: completed
tags: [snapshot, mcp, copilot, limitation, rollback]
related_files:
  - projects/mmv-tarots/.mcp.json
---

# Snapshot: MMV MCP ไม่พร้อมใช้งานใน Copilot Runtime ตอนนี้

**Time**: 2026-03-16 09:15 +0700
**Context**: ทดสอบการใช้ Next.js MCP (`next-devtools-mcp`) กับ GitHub Copilot ใน workspace นี้ แล้วทำ rollback ตามคำสั่งผู้ใช้

## Tags
`mcp` `copilot` `nextjs` `runtime-tools` `rollback`

## Insight
- แม้จะตั้งค่า `.mcp.json` ได้ แต่ใน runtime ของ Copilot รอบนี้ **ยังไม่เห็น MCP tools ถูก expose** (เช่น `get_logs`, `get_errors` จาก next-devtools-mcp ไม่ปรากฏเป็น callable tools)
- ผลคือ agent ไม่สามารถเรียก MCP tool โดยตรงผ่าน tool API ของรอบสนทนานี้

## Evidence
- `.mcp.json` เคยถูกสร้างพร้อม config `next-devtools-mcp@latest`
- ตรวจสอบการใช้งานแล้วไม่พบ tool ของ MCP ใน tool surface ที่เรียกได้จริง
- ทำ rollback สำเร็จ: ลบไฟล์ `projects/mmv-tarots/.mcp.json` ออกแล้ว

## Why It Is Not Working (Current Context)
- ชั้นการตั้งค่าไฟล์ `.mcp.json` กับชั้นการ expose tools ของ Copilot runtime ยังไม่เชื่อมกันใน session นี้
- ดังนั้น config มีอยู่ได้ แต่ agent ยังเรียก tool แบบ native ไม่ได้

## Apply When
- ใช้เมื่อเจอสถานะ “ตั้งค่า MCP แล้วแต่เรียกเครื่องมือไม่ได้” ใน GitHub Copilot runtime ลักษณะเดียวกัน

## Next Actions
- ถ้าจะลองใหม่ในอนาคต ให้เช็กก่อนว่า runtime/tool surface ของ Copilot ในเวอร์ชันนั้น expose MCP tools แล้วจริง
- หากยังไม่ expose ให้ถือว่าใช้ไม่ได้เชิงปฏิบัติใน session นั้น
