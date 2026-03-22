---
type: snapshot
project: mmv-tarots
task_id: "#mmv-profile-transactions-billing-split"
status: active
tags: [snapshot, phase1, profile, transactions, billing, ia]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/app/profile/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/__tests__/app/profile-page-phase1.test.tsx
---

# Snapshot: MMV Phase 1 Profile IA Refactor Completed

**Time**: 2026-03-17 21:40 +0700
**Context**: Execute ggg phase 1 for profile split plan; remove in-profile tabs and convert profile to account hub with route quick links.

## Evidence
- Commit: `f927af6`
- Hard Gate:
  - Build: PASS
  - Lint: PASS
  - Test: PASS (39 files, 203 tests)
- Regression test added: `__tests__/app/profile-page-phase1.test.tsx`

## What Changed
- Removed legacy Predictions/Transactions tab state and UI from profile page.
- Removed in-profile recent predictions and transaction feed.
- Added account hub quick links to:
  - `/history` (prediction history source)
  - `/transactions` (next phase target)
  - `/billing` (next phase target)
- Preserved wallet, referral, support, legal, sign out sections.

## Apply When
- You need to separate user account navigation from history/billing data surfaces.
- You want low-risk IA refactor before introducing new transactional/billing routes.

## Next Actions
- Execute Phase 2: create `/transactions` surface using `/api/credits/history` standalone page.
- Update navigation page typing to include `/transactions` and `/billing` when those routes land.

## Tags
`snapshot` `mmv-tarots` `phase1` `profile-refactor` `ggg`
