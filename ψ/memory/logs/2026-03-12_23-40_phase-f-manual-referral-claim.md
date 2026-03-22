---
type: snapshot
project: mmv-tarots
task_id: "#universal-referral"
status: active
tags: [snapshot, referral, phase-f, claim]
related_files: [projects/mmv-tarots/app/api/user/referral-claim/route.ts, projects/mmv-tarots/app/profile/page.tsx, projects/mmv-tarots/app/api/user/me/route.ts]
---

# Snapshot: Phase F Manual Referral Claim Slot

**Time**: 2026-03-12 23:40 +0700  
**Context**: Implement `ggg` Phase F for `mmv-tarots` to add fallback manual referral-code claim while preserving one-time recipient entitlement and onboarding gate constraints.

## Tags
- `phase-f`
- `manual-claim`
- `one-time-entitlement`
- `onboarding-gate`

## Evidence
- Added `POST /api/user/referral-claim` with strict guards: reject when `referredById` exists, reject when `onboardingCompleted=true`, reject self-referral, reject invalid code.
- Added profile-side manual claim input/action, only shown when user is still eligible (`!referredById && !onboardingCompleted`).
- Expanded API test coverage in `__tests__/api/referral-claim-route.test.ts` for unauthenticated, missing code, already claimed, onboarding completed, self-referral, invalid code, and success paths.
- Hard gate passed:
  - `npm run build`
  - `npm run lint`
  - `npm test` (`26 files`, `153 tests`)
- Commit: `6edad71` (`feat(#universal-referral): implement phase F manual referral claim slot`).

## Apply When
- Use this pattern when referral-link context can be lost and a manual code claim fallback is required without allowing referral overwrite or post-onboarding claim abuse.

## Next Actions
- Continue with Phase G (LIFF-aware CTA priority: code-first in LIFF mode) and add corresponding LIFF-branch tests.
