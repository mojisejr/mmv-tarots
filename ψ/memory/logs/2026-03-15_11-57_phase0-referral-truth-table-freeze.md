---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-semantic-refactor"
status: active
tags: [snapshot, phase0, referral, truth-table, policy-lock]
related_files:
  - projects/mmv-tarots/docs/referral-policy-truth-table-phase0.md
  - ψ/memory/logs/mmv-tarots/2026-03-15_11-35_mmv-referral-semantic-refactor-plan.md
---

# Snapshot: MMV Phase 0 Truth Table Freeze

**Time**: 2026-03-15 11:57:00 +0700
**Context**: Execute `ggg` Phase 0 for referral semantic refactor by freezing policy matrix and deny-case contract before schema/code changes.

## Evidence
- Added canonical truth table in `projects/mmv-tarots/docs/referral-policy-truth-table-phase0.md`.
- Contract includes all required paths: no referral, link before signup, manual before onboarding, manual after onboarding (deny), link then manual (deny).
- Explicit deny-case DC-01 locked: link-consumed users cannot claim manual code later.
- Hard Gate results:
  - `npm run build` passed
  - `npm run lint` passed
  - `npm run test` passed (`178 passed`, `32 files`)
- Repo commit created in Site:
  - `5c58032` `feat(#mmv-referral-semantic-refactor): freeze phase0 truth table and deny-case contract`

## Apply When
- Starting Phase 1 schema migration and source-aware referral model work.
- Reviewing payout disputes where link/manual paths are confused.
- Checking whether new tests or code violate frozen policy boundaries.

## Next Actions
- Start Phase 1 with additive-only migration (`source`, `status` fields) and legacy-safe backfill.
- Add migration dry-run test evidence for legacy rows classification.

## Tags
`snapshot` `ggg` `phase0` `mmv-tarots` `referral` `truth-table`
