# Snapshot: Fix Triple Star Glitch & UI Desync

**Time**: 2026-01-19 22:55 (GMT+7)
**Context**: Finalizing the "Triple Star Glitch" fix where users received 3 stars instead of 2, and fixing the UI not updating immediately.

## Insight

The root cause of the "Triple Star" and "Double History" issues was a combination of:
1.  **Race Condition**: Better Auth's `onSuccess` hook firing in parallel with the Onboarding Ritual.
2.  **Missing Idempotency**: The `ReferralService` didn't check if a `ReferralHistory` entry already existed for a specific referrer-referee pair, leading to duplicate records when called concurrently.
3.  **State Desync**: The Frontend `WelcomeRitual` displayed a success toast but didn't trigger a refetch of the user's credits, leading to a stale UI (showing 1 star instead of 2 or 3) until a hard refresh.

## Solutions Implemented

1.  **Backend Idempotency (`referral-service.ts`)**:
    - Added a check: `tx.referralHistory.findFirst({ where: { referrerId, refereeId } })`.
    - If a history record exists, the service now skips creating a new one, returning the existing record instead. This effectively dedupes concurrent calls.

2.  **Frontend Sync (`WelcomeRitual.tsx`)**:
    - Integrated `useNavigation` hook to access `refreshBalance()`.
    - Forced `await refreshBalance()` immediately after the onboarding API call succeeds.
    - Updated the Toast message logic to dynamic feedback based on the actual reward received.

3.  **Verification**:
    - `npm run build`: PASSED
    - `npm run lint`: PASSED

## Apply When

-   **Parallel Hooks**: Whenever using multiple entry points (Auth Hooks + API Routes) that might trigger the same business logic.
-   **Reward Systems**: Always check for "Already Rewarded" state using a unique constraint or explicit query before granting.
-   **SPA State**: When a server mutation changes user balance/status, always force a client-side store refresh immediately.

## Tags

`fix` `idempotency` `race-condition` `ui-sync` `mmv-tarots`
