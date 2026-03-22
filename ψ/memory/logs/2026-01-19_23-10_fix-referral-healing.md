# Snapshot: Self-Healing Referral Logic

**Time**: 2026-01-19 23:10 (GMT+7)
**Context**: Fixing the "Missing Referral" bug where users were not getting the full 2 stars because the referral link failed to establish during the initial Auth Hook.

## Insight

**The Problem**:
The "Better Auth" hook uses a "Fire & Forget" strategy (`Promise.allSettled`) to process referral codes during signup. This is done to minimize latency (P2028). However, this background promise can sometimes be terminated prematurely by the serverless environment, or fail silently due to race conditions.
When this happens, the `referredById` field on the User record remains `null`.
The Onboarding Ritual (`PATCH /api/user/onboarding`) previously assumed that if `referredById` was null, the user had no referrer, and thus skipped granting the referral bonus.

**The Fix (Self-Healing)**:
We moved the responsibility of *repairing* the broken link to the **Onboarding Ritual** itself.
1.  **Check**: If `currentUser.referredById` is missing...
2.  **Verify**: Check the `mmv_ref` cookie explicitly in the API route.
3.  **Heal**: If a cookie is found, call `referralService.processReferralSignup` immediately (and await it) to establish the link.
4.  **Refresh**: validatethat the user is now linked, and proceed to grant the bonus.

This ensures that even if the initial "fast" path fails, the "guaranteed" path (Ritual) catches and fixes it.

## Technical Details

-   Modified `app/api/user/onboarding/route.ts` to include `Self-Healing Linkage`.
-   Uses `next/headers` cookies to retrieve `mmv_ref`.
-   Manually creates the link using `referralService`.

## Apply When

-   **Distributed/Async Systems**: When relying on background jobs for critical data (like attribution), always have a "Lazy/Just-in-Time" check at the moment of value realization (e.g., granting reward) to ensure data integrity.

## Tags

`fix` `referral` `self-healing` `robustness`
