---
type: snapshot
project: mmv-tarots
task_id: "#mmv-profile-transactions-billing-split"
status: active
tags: [snapshot, navigation, desktop, transactions, billing]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/components/layout/profile-dropdown.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/docs/2026-03-16_23-10_mmv-profile-transactions-billing-split-plan.md
---

# Snapshot: MMV Desktop Topnav Adds Transactions + Billing

**Time**: 2026-03-18 08:13:02 +0700
**Context**: Follow-up implementation under `/ggg` after phase-5 rollout; scope constrained to desktop top navigation only.

## Tags
`snapshot` `mmv-tarots` `desktop-nav` `transactions` `billing` `hard-gate`

## Evidence
- Commit (implementation): `5b9a840` — `feat(nav): #mmv-profile-transactions-billing-split add desktop transactions and billing menu`
- Updated desktop menu source: `components/layout/profile-dropdown.tsx`
- Added entries:
  - `Transactions` -> `/transactions`
  - `Billing` -> `/billing`
- Mobile navigation intentionally unchanged.
- Hard Gate results:
  - `npm run build`: PASS
  - `npm run lint`: PASS
  - `npm test`: PASS (`42` files, `212` tests)

## Apply When
- ต้องการเพิ่ม discoverability ของหน้าการเงินให้ผู้ใช้ desktop โดยไม่เพิ่มความหนาแน่นของ mobile bottom nav.
- ต้องการยืนยันว่า dual-surface (`Transactions` wallet ledger + `Billing` payment lifecycle) ถูกเข้าถึงจาก top navigation.

## Next Actions
- Manual smoke: เปิด dropdown บน desktop แล้วตรวจการนำทาง `/transactions` และ `/billing`.
- หลังคุณนนท์ลองโอนจริง 1 รอบ ให้ตรวจ consistency ระหว่างรายการใน Billing และ ledger ใน Transactions.
