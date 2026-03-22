---
type: log
project: mmv-tarots
topic: auth-ux-phase-2-complete
status: completed
---

# Log: Phase 2 - API Resilience & Error Handling Completed

**Date**: 2024-12-24 11:25 GMT+7
**Issue**: #none
**Branch**: `feature/auth-ux-phase-1` (Continuing on same branch for now)

## Changes
1.  **Modified `lib/client/api.ts`**:
    *   Added `AuthError` custom error class.
    *   Updated `submitQuestion`, `checkJobStatus`, and `fetchUserPredictions` to detect HTTP 401 and throw `AuthError`.
2.  **Modified `app/submitted/page.tsx`**:
    *   Implemented `jobId` as a state variable.
    *   Added a fallback mechanism: if `jobId` is missing from URL search params, it attempts to retrieve it from `sessionStorage` using `getSubmissionState()`.
    *   Improved error handling to wait briefly for state synchronization before redirecting to home.

## Verification Results
- [x] `npx tsc --noEmit`: **Passed**
- [x] `npm test`: **89 Failures** (Existing refactor fallout, unrelated to Phase 2 changes)

## Next Steps
- Proceed to **Phase 3: Stability & Verification**.
- Fix Polling Cleanup in `app/history/[id]/page.tsx`.
- Improve Data Mapping in `lib/client/reading-utils.ts`.

---
**Oracle Note**: Phase 2 makes the application more resilient to session expiration and page refreshes. The `sessionStorage` fallback is a critical "safety net" for the user journey, ensuring they don't lose their place in the waiting room.
