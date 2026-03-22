# Snapshot: Referral System Audit (mmv-tarots)
**Date**: 2025-12-26 22:55
**Issue**: #none

## Current State
- **Database**: `User` model already has `referralCode` (String, unique, default `cuid()`).
- **Design**: Found in `docs/template.html` (Line 966).
  - Reward: Referee gets 1 Star, Referrer gets 1 Star + 5 Coins.
  - Link format: `mimi.vibe/ref/CODE`.
- **Implementation**: 
  - `app/profile/page.tsx` does NOT display the referral link yet.
  - No logic to capture `ref` from URL.
  - No logic to reward users on sign-up.

## Plan
1. **Schema Update**: Add `referredById` to `User` model to track the relationship.
2. **Capture Logic**: Use middleware or a client-side effect to save `ref` from URL to a cookie.
3. **Reward Logic**: Update auth callback or a post-login hook to check for the referral cookie and grant stars/coins.
4. **UI Update**: Add the "Referral Program" card to the Profile page.

## Tools Used
- `grep_search`, `run_in_terminal` (grep), `read_file`, `list_dir`.
