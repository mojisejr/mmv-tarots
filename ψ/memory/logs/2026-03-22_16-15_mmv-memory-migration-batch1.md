---
type: snapshot
project: mmv-tarots
task_id: "#hq-spaces-integration"
status: active
tags: [snapshot, migration, mmv-tarots, site-memory, batch1]
related_files:
  - /Users/non/dev/opilot/scripts/migrate-site-memory.sh
  - /Users/non/dev/opilot/.tmp/mmv-safe-retros.txt
  - /Users/non/dev/opilot/ψ/memory/logs/oracle/2026-03-22_16-00_project-by-project-retro-review.md
---

# Snapshot: MMV-Tarots Legacy Memory Migration Batch 1

**Time**: 2026-03-22 16:15 +0700
**Context**: ย้าย legacy memory ของ `mmv-tarots` จาก HQ `ψ/memory/` เข้าสู่ `projects/mmv-tarots/ψ/memory/` ตาม workflow review-first โดยรอบนี้ย้าย `logs ทั้งหมด` และ `retrospective safe-to-move ชุดแรก` เท่านั้น

## Tags
- snapshot
- migration
- mmv-tarots
- site-memory
- batch1
- retrospective-review

## What Changed
- ย้าย HQ logs ของ `mmv-tarots` ทั้งหมดเข้า `projects/mmv-tarots/ψ/memory/logs/`
- ย้าย retrospective ชุด safe-to-move 38 ไฟล์เข้า `projects/mmv-tarots/ψ/memory/retrospectives/`
- คงไฟล์ retrospective ที่เป็น `needs-review` หรือ `keep-in-hq` ไว้ที่ HQ ต่อไป ยังไม่ย้ายในรอบนี้

## Evidence
- Post-move counts:
  - `HQ_LOG_COUNT=0`
  - `SITE_LOG_COUNT=384`
  - `SITE_RETRO_COUNT=38`
- Representative moved retrospectives found in site repo:
  - `2026-01/05/22.17_neon-database-branching-strategy.md`
  - `2026-02/21/23.27_mmv-tarots-omise-pivot.md`
  - `2026-03/11/23.30_mmv-tarots-payment-phase-1-complete.md`
- Workflow guardrail used:
  - logs moved aggressively by project path
  - retrospectives moved only from explicit safe list after review

## Apply When
- เมื่อ project มี legacy logs ปริมาณมากใน HQ และสามารถย้ายได้ทั้งก้อนอย่างปลอดภัย
- เมื่อ retrospective ของ project มี subset ที่ review แล้วว่าเป็น project history ชัดเจน
- เมื่อต้องการแยก `safe batch` ออกจาก `needs-review` เพื่อให้ migration เดินต่อได้โดยไม่เสี่ยงย้ายผิด scope

## Next Actions
- review retrospective กลุ่ม `needs-review` ของ `mmv-tarots` ต่อใน batch ถัดไป
- commit ใน repo `projects/mmv-tarots` แยกจาก HQ cleanup
- commit HQ deletions ของ batch นี้หลังจากคุณนนท์ยืนยันว่าการย้ายรอบแรกถูกต้อง