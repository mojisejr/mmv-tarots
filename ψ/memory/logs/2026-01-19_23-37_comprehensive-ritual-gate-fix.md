# Snapshot: Comprehensive Fix - The Ritual Gate & Atomic Rewards

**Time**: 2026-01-19 23:37 (GMT+7)
**Context**: Finalizing the "Triple Star Glitch" and "Referral Race Condition" debugging session.

## Insight: The Anatomy of a Reward Glitch

The "Triple Star Glitch" was a classic example of **Distributed State Inconsistency**. We were granting rewards through two parallel channels:
1.  **Auth Hooks (Fast Path)**: Better Auth `afterUserCreate` hook (Async/Fire & Forget).
2.  **Onboarding Ritual (Guaranteed Path)**: `PATCH /api/user/onboarding` (Client-driven).

### The Root Causes found:
- **Parallel Overload**: Both paths tried to grant 1 star simultaneously, leading to 2 stars. If one was called twice (due to retries or hooks firing twice), it became 3.
- **Race conditions**: The check-then-set logic (`user.onboardingCompleted`) was not atomic, allowing multiple requests to "win" simultaneously.
- **Hook Unreliability**: Serverless background promises (Fire & Forget) were occasionally terminated before updating `referredById`, causing missing referral bonuses.

## The "True Fix" Methodology

We established a **"Hard Isolation"** strategy to ensure exactly-once reward delivery:

1.  **The Solo-Authority (Ritual Gate)**: 
    - Removed all star-granting logic from Auth Hooks. Hooks now ONLY record the intent to link (Phase 1).
    - Centralized all rewards in the **Onboarding Ritual API** (Phase 2). This is the only gate where stars are born.

2.  **Atomic Mutex (Database Locking)**:
    - Replaced standard `.update()` with an **Atomic Lock** via `updateMany`. 
    - Logic: `UPDATE SET onboardingCompleted = true WHERE id = ? AND onboardingCompleted = false`.
    - This ensures that only exactly ONE execution thread can transition the user state and trigger the reward block.

3.  **Self-Healing Strategy**:
    - Added a resilience layer: If the data from Phase 1 (Auth Hook) is missing, the API tries to "heal" itself by checking for the referral cookie and repairing the link *before* granting the bonus.

4.  **Idempotent Transaction Logs**: 
    - Every reward is wrapped in an idempotency check against the `CreditTransaction` table by `userId` and `type` to prevent duplicate accounting even if the code is called again.

5.  **Visual Synchronization**:
    - Forced an immediate `refreshBalance()` on the frontend successful ritual to eliminate the "Stale Star" UI bug where users thought they had no stars until a refresh.

## Apply When

- **Critical Assets**: When granting currency, credits, or unique rewards.
- **Multi-step Onboarding**: When user state transitions are triggered by multiple events (Signup, Hook, First Visit).
- **Serverless Environments**: When background async tasks cannot be 100% guaranteed.

## Tags

`architecture` `race-condition` `idempotency` `ritual-gate` `mmv-tarots` `atomic-lock`
