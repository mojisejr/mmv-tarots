---
type: snapshot
project: mmv-tarots
task_id: "#universal-referral"
status: active
tags: [snapshot, implementation, referral, phase-a]
related_files: [projects/mmv-tarots/lib/referral-utils.ts, projects/mmv-tarots/__tests__/lib/referral-phase2.test.ts]
---

# Snapshot: Phase A Canonical Web Link Completed

**Time**: 2026-03-12 22:46 +0700
**Context**: `ggg` execution for `#universal-referral` in `projects/mmv-tarots`, implementing `Phase A` from the active plan.

## Tags
- `phase-a`
- `canonical-link`
- `referral-utils`
- `hard-gate-pass`

## Evidence
- Updated `ReferralUtils.generateLink()` to use canonical web base URL strategy:
  - primary: `NEXT_PUBLIC_APP_URL`
  - fallback: runtime `origin`
- Removed LIFF-first generation from share-link contract in `generateLink()`.
- Preserved behavior:
  - path normalization
  - existing query preservation
  - `ref` append logic
- Updated phase test assertions in `__tests__/lib/referral-phase2.test.ts` to validate canonical web URLs.
- Hard Gate results:
  - `npm run build`: pass
  - `npm run lint`: pass
  - `npm test`: pass (`24 files`, `138 tests`)
- Commit created (no push): `3fcafee`

## Apply When
- You need referral links to work consistently across Browser/Google/Facebook contexts while keeping LIFF compatibility in gateway flow.
- You want env-driven canonical URL (`NEXT_PUBLIC_APP_URL`) without breaking query/ref semantics.

## Next Actions
- Implement `Phase B` gate consistency review and reduce duplicate reward paths between onboarding gate and legacy `referral-check` flow.
- Continue with `Phase C` to verify LIFF gateway compatibility under canonical web entry.
