# Snapshot: Referral Program x Social Sharing Implementation Blueprint

**Date**: 2026-01-07 15:56 GMT+7
**Project**: mmv-tarots
**Status**: Planning Complete -> Ready for Implementation

## Objective
Enable a seamless referral loop where users sharing their tarot predictions automatically invite new users via a referral code embedded in the link. Reward both the referrer and the referee upon successful registration.

## Engineering Phases

### Phase 1: Shared Link Enhancement (Client-Side)
- **Target**: `projects/mmv-tarots/components/reading/share-actions.tsx`
- **Action**: Modify `getShareUrl` to include `?ref=[referralCode]`.
- **Constraint**: Must handle guest users (no ref code) vs. logged-in users.

### Phase 2: Referral Capture (Edge-Side)
- **Target**: `projects/mmv-tarots/middleware.ts`
- **Action**: Detect `ref` query param in incoming requests.
- **Persistence**: Store the code in a secure, long-lived cookie (`mmv_ref`) if not already present (First-touch attribution).

### Phase 3: Post-Login Attribution (Server-Side)
- **Target**: `projects/mmv-tarots/lib/server/auth.ts` (Better-Auth Hooks)
- **Action**: Use `databaseHooks.user.create.after` or a customized login sync.
- **Logic**:
    1. Check for `mmv_ref` cookie.
    2. Lookup `User` who owns that `referralCode`.
    3. Update the newly created user's `referredById`.
    4. Grant initial rewards (Stars) to both parties.

### Phase 4: UI/UX Feedback (Client-Side)
- **Target**: Promotion/Loyalty components.
- **Action**: Show "You were referred by [Name]" or "Success! You earned 5 stars."

## Technical Guardrails
- **Vercel Compatibility**: Use `NextRequest`/`NextResponse` for cookie handling. Ensure `secure: true` in production.
- **Prisma Integrity**: Use transactions when awarding stars to prevent double-spending or partial failures.
- **Edge cases**: Don't allow users to refer themselves. Prevent re-assignment if `referredById` is already set.

## Success Metrics
- Sharing URL contains `ref=...`
- `mmv_ref` cookie present on Landing Page after clicking.
- New users in DB have `referredById` linked to the correct referrer.

---
**Oracle Snapshot ID**: `2026-01-07_referral-blueprint`
**Human Confirmation**: Pending.
