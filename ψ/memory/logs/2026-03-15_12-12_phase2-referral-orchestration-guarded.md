---
type: snapshot
project: mmv-tarots
task_id: "#mmv-referral-semantic-refactor"
status: active
tags: [snapshot, ggg, phase2, orchestration, referral]
related_files:
  - projects/mmv-tarots/lib/server/services/onboarding-orchestration-service.ts
  - projects/mmv-tarots/lib/server/services/referral-claim-service.ts
  - projects/mmv-tarots/app/api/user/onboarding/route.ts
  - projects/mmv-tarots/app/api/user/referral-claim/route.ts
---

# Snapshot: MMV Phase 2 Orchestration and Source-Aware Claim Guard

**Time**: 2026-03-15 12:12:55 +0700
**Context**: Execute `ggg phase 2` by moving onboarding/claim branching into dedicated services and enforcing source-aware manual claim eligibility.

## Evidence
- Added service-layer orchestration:
  - `lib/server/services/onboarding-orchestration-service.ts`
  - `lib/server/services/referral-claim-service.ts`
- Converted routes to thin transport:
  - `app/api/user/onboarding/route.ts`
  - `app/api/user/referral-claim/route.ts`
- Enforced source-aware guard:
  - manual claim rejected for link-attributed entitlement path.
- Normalized onboarding reward behavior for phase boundary:
  - onboarding returns universal reward only (`+1`) with idempotent replay support.
- Added/updated tests:
  - `__tests__/services/onboarding-orchestration-service.test.ts`
  - `__tests__/services/referral-claim-service.test.ts`
  - `__tests__/api/onboarding-route.test.ts`
  - `__tests__/api/referral-claim-route.test.ts`
  - `__tests__/e2e/referral-reliability-phase3.test.ts`
  - `__tests__/lib/referral-service-phase2.test.ts`
- Commit:
  - `861c798` `feat(#mmv-referral-semantic-refactor): complete phase2 orchestration refactor and source-aware claim guard`

## Next Actions
- Phase 3: consolidate first-prediction reward engine and separate universal `+1` from source-aware referral payouts.
- Add deterministic replay tests for first-prediction callback to prove exactly-once payout semantics.

## Tags
`snapshot` `ggg` `phase2` `mmv-tarots` `referral` `orchestration`
