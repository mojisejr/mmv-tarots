---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-semantic-refactor"
status: active
tags: [snapshot, ggg, phase1, schema, referral]
related_files:
  - projects/mmv-tarots/prisma/schema.prisma
  - projects/mmv-tarots/prisma/migrations/20260315120500_referral_source_state_phase1/migration.sql
  - projects/mmv-tarots/lib/server/referral/referral-phase1-domain.ts
  - projects/mmv-tarots/__tests__/lib/referral-phase1-domain.test.ts
---

# Snapshot: MMV Phase 1 Source-Aware Schema and Domain Guard

**Time**: 2026-03-15 12:02:02 +0700
**Context**: Execute `ggg phase 1` to deliver additive schema/domain refactor without behavior-breaking payout changes.

## Evidence
- Added new referral domain contract in `constants/referral.ts`:
  - `REWARD_POLICY_EVENTS`
  - `ReferralSource` (`LINK`, `MANUAL_CODE`)
  - `ReferralEligibilityState` (`PENDING_FIRST_PREDICTION`, `GRANTED`, `BLOCKED`, `CANCELED`)
- Updated `ReferralHistory` schema in `prisma/schema.prisma` with additive nullable fields:
  - `source`
  - `eligibility_state`
- Added migration:
  - `prisma/migrations/20260315120500_referral_source_state_phase1/migration.sql`
  - Creates enums and adds nullable columns + indexes only (no destructive mutation)
- Added deterministic legacy backfill mapper:
  - `lib/server/referral/referral-phase1-domain.ts`
- Added migration safety tests:
  - `__tests__/lib/referral-phase1-domain.test.ts`

## Hard Gate
- `npm run build` PASS (migration deployed)
- `npm run lint` PASS
- `npm run test` PASS (`33 files`, `183 tests`)

## Next Actions
- Start Phase 2: move onboarding/claim branching into dedicated service layer while preserving route response contracts.
- Wire source-aware eligibility checks in orchestration without changing payout timing outside contract.

## Tags
`snapshot` `phase1` `ggg` `mmv-tarots` `referral` `schema`
