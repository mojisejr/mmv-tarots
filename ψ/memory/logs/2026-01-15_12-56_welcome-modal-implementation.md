# Snapshot: Welcome Modal Implementation (Block 1-3 Complete)

**Time**: 2026-01-15 12:56
**Project**: mmv-tarots
**Context**: Implementing the Welcome Ritual Modal for new users.

## Changes
1.  **Backend**:
    - Schema: Added `User.onboardingCompleted`.
    - API: `PATCH /api/user/onboarding` triggers `onboardingCompleted` = true.
    - Auth: Added `onboardingCompleted` to `better-auth` session.
2.  **UI Components**:
    - `WelcomeModal`: Glassmorphism design, shows "+1 Free Credit".
    - `WelcomeRitual`: Handles session checking and API calls.
3.  **Integration**:
    - Added `WelcomeRitual` to `app/layout.tsx`.

## Key Decisions
- **Session Sync**: Opted for generic UI state update (`isOpen(false)`) rather than forcing a hard session refresh, to keep UX smooth.
- **Bonus Logic**: The `+1` star is actually granted by `CreditService.grantOnboardingBonus` during signup (in `auth.ts` hooks), so the modal is purely informational/ritualistic, not transactional.
- **Component Location**: `components/features/onboarding` for better organization.

## Tags
`feature` `onboarding` `mmv-tarots` `ui`
