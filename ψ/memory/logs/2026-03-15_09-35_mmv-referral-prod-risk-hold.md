---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-production-readiness"
status: active
tags: [snapshot, insight, referral, production-risk]
related_files:
  - projects/mmv-tarots/lib/server/services/referral-service.ts
  - projects/mmv-tarots/app/api/user/onboarding/route.ts
  - projects/mmv-tarots/services/tarot-service.ts
  - projects/mmv-tarots/middleware.ts
---

# Snapshot: MMV Referral Production Risk (Hold Details)

**Time**: 2026-03-15 09:35 +07
**Context**: Grounding ระบบ referral ของ `mmv-tarots` เสร็จแล้วระดับ code-path + targeted tests แต่ผู้ใช้ขอพักรายละเอียดเชิงลึกไว้ก่อนเพื่อค่อยลงแผนแก้ทีหลัง

## Tags
`mmv-tarots` `referral` `social-share` `onboarding-gate` `reward-integrity` `production`

## Insight
- สถานะปัจจุบัน: มีความเสี่ยงระดับสูงต่อความถูกต้องของ reward/ledger หากปล่อย production ทันทีโดยไม่ harden เพิ่ม
- คำสั่งจากผู้ใช้ล่าสุด: "รายละเอียดทั้งหมดเอาไว้ก่อน"

## Evidence
- จุดเสี่ยง duplicate/overpay กระจุกที่ flow reward:
  - `projects/mmv-tarots/lib/server/services/referral-service.ts`
  - `projects/mmv-tarots/app/api/user/onboarding/route.ts`
  - `projects/mmv-tarots/services/tarot-service.ts`
- ชุดทดสอบที่รันแล้วผ่าน: middleware + referral-claim + referral-check + referral-phase2 (targeted)

## Apply When
- ใช้ snapshot นี้ตอนกลับมาเริ่ม phase hardening ก่อน deploy referral production
- ใช้เป็น anchor เพื่อแยก "decision hold" ออกจาก "implementation plan"

## Next Actions
- รอผู้ใช้สั่งเริ่ม phase แก้จริง
- เมื่อเริ่ม: ทำ critical-first (idempotency, single-source reward rule, ledger accuracy, onboarding test coverage)
