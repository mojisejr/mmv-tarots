# Snapshot: Fix Onboarding Race Condition

**Time**: 2026-01-19 23:25 (GMT+7)
**Context**: Fixing the "Triple Star Glitch" where users received 3 stars instead of 2. The likely cause was a Race Condition in `onboarding/route.ts` allowing double execution of the reward logic.

## Insight

**The Glitch**:
Users reported having 3 stars immediately after onboarding (Standard is 1, Referred is 2).
Investigation revealed that despite creating `ReferralHistory` correctly, the **Bonus Granting Transaction** inside `PATCH /api/user/onboarding` was likely running twice in parallel execution (Race Condition).
This happens when `onboardingCompleted` check (Read) and Update (Write) are not atomic across concurrent requests.

**The Fix**:
We implemented an **Atomic Lock Strategy** using `updateMany`:

```typescript
const updateResult = await tx.user.updateMany({
  where: { 
    id: user.id, 
    onboardingCompleted: false // Only succeeds if currently false
  },
  data: { onboardingCompleted: true }
});

if (updateResult.count === 0) {
  return { completed: false }; // Lost the race, exit gracefully
}

// Proceed with reward granting...
```

This guarantees that only **ONE** request can ever transition the user from `false` to `true`, effectively serializing the reward logic and preventing double-dipping.

## Technical Details

-   Use `updateMany` inside a transaction as a mutex.
-   Returns `{ completed: true/false }` from the transaction to handle the controller logic correctly.
-   If `!result.completed`, return success (idempotent) but reward `0`.

## Apply When

-   **One-Time Events**: Any "Claim Once" logic (Rewards, Coupons, Onboarding).
-   **Concurrent APIs**: When the client might fire multiple requests (retry logic, React Strict Mode, impatient users).

## Tags

`fix` `concurrency` `race-condition` `atomic-lock`
