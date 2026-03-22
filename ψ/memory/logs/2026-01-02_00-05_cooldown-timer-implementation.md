# Snapshot: Cooldown Timer Implementation

**Time**: 2026-01-02 00:05
**Context**: Implemented the Cooldown Timer UX/UI to replace the generic 429 error message.

## Changes Implemented

### 1. Backend (API Layer)
- **`app/api/predict/route.ts`**: 
    - Implemented `after()` for background processing to prevent Vercel suspension.
    - Added Rate Limiting logic (2 minutes) returning `retryAfter` in error details.
- **`app/api/user/me/route.ts`**: 
    - Added `lastPredictionAt` to the response to support initial client-side timer sync.

### 2. Frontend (Client Layer)
- **`lib/client/api.ts`**: 
    - Fixed error parsing logic to correctly extract `retryAfter` from the nested `error.details` object.
    - This ensures `RateLimitError` is thrown correctly instead of a generic Error.
- **`app/page.tsx`**: 
    - Added `cooldownRemaining` state and `setInterval` logic.
    - Implemented initial sync using `lastPredictionAt` from user profile.
- **`components/ui/question-input.tsx`**: 
    - Updated UI to show countdown timer (e.g., "01:45") on the submit button when cooldown is active.
    - Disabled input and button during cooldown.

## Verification
- **Build**: Passed (`npm run build`).
- **Lint**: Passed (`npm run lint`).
- **Logic**: Verified that `RateLimitError` is correctly caught and updates the timer state.

## Next Steps
- Deploy to Vercel and verify in production.
- Monitor for any edge cases with client-server time drift (though `retryAfter` handles the error case robustly).

## Tags
`ux-improvement` `cooldown-timer` `rate-limiting` `nextjs-after`
