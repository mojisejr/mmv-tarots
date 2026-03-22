# Snapshot: Referral System Implementation Plan (mmv-tarots)
**Date**: 2025-12-26 23:01
**Issue**: #none
**Status**: Planned / Ready for Phase 1

## 🗺️ Implementation Strategy

### Phase 1: Database & Core Logic (The Foundation)
- **Tasks**:
    1. **Prisma Schema**: Add `referredById` (String?) and self-relation to `User` model.
    2. **CreditService**: Implement `applyReferralReward(referrerId, refereeId)` using Prisma Transactions.
- **Success Criteria**: Migration successful; Unit tests pass for reward logic and transaction logging.
- **Reward**: Referrer +2 Stars, Referee +1 Star.

### Phase 2: Referral Capture (The Hook)
- **Tasks**:
    1. **Capture Logic**: Detect `?ref=CODE` in URL via Middleware or Client Hook.
    2. **Storage**: Save `CODE` in a secure cookie (`mmv_ref`) with 7-30 days expiry.
- **Success Criteria**: Cookie is correctly set when visiting a referral link.

### Phase 3: Reward Engine (The Automation)
- **Tasks**:
    1. **Auth Integration**: Check for `mmv_ref` cookie during user creation/first login.
    2. **Validation**: Ensure code exists, is not the user's own code, and user hasn't been referred before.
    3. **Execution**: Trigger `CreditService.applyReferralReward()`.
- **Success Criteria**: Automatic star distribution upon successful sign-up via link.

### Phase 4: UI & Experience (The Interface)
- **Tasks**:
    1. **Profile UI**: Add "Referral Program" card to `app/profile/page.tsx`.
    2. **Sharing**: Implement "Copy Link" functionality with absolute URL generation.
- **Success Criteria**: Users can easily find and share their referral links.

---

## 🛡️ Critical Precautions

1. **Database Safety**: 
    - `referredById` must be optional to support existing users.
    - Use atomic transactions for star rewards to prevent data inconsistency.
2. **Fraud Prevention**:
    - Prevent self-referrals.
    - Ensure one-time reward per new user (Idempotency).
3. **Performance**:
    - Referral checks should not block the main authentication flow.
4. **Migration**:
    - Ensure `npx prisma migrate dev` is run and client is regenerated.

---

## Next Step
- Start Phase 1: Update `prisma/schema.prisma`.
