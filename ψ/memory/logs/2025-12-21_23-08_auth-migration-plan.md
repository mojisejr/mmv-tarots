# Implementation Plan: Migrating from Static Mockup to Better Auth

**Project**: mmv-tarots
**Date**: 2025-12-21 23:08
**Status**: Planned
**Issue**: #none

## Overview
Replace the temporary `StaticUserManager` (localStorage-based) with a robust authentication system using **Better Auth**. This will ensure data security, persistence across devices, and a professional user experience.

## Phase 1: API & Library Refactoring
1.  **Refactor `lib/api.ts`**:
    *   Remove `StaticUserManager` imports and usages.
    *   Update `fetchUserPredictions` to not require a `userId` parameter (it will use the session on the server).
    *   Remove `userIdentifier` from `submitQuestion` payload (server will identify user via session).
2.  **Cleanup**:
    *   Delete `lib/user-manager.ts`.

## Phase 2: Backend Security & Endpoints
1.  **Create `app/api/predictions/me/route.ts`**:
    *   New endpoint to fetch predictions for the currently logged-in user.
    *   Enforce session check using `auth.api.getSession`.
2.  **Update `app/api/predict/route.ts`**:
    *   Enforce authentication (return 401 if no session).
    *   Use `session.user.id` for the `userIdentifier` field in Prisma.
3.  **Deprecate `app/api/predictions/user/[userId]/route.ts`**:
    *   Keep for backward compatibility during migration or remove if no longer needed.

## Phase 3: Frontend Integration
1.  **Update `app/profile/page.tsx`**:
    *   Call `fetchUserPredictions()` without arguments.
    *   Ensure the UI handles the "Not Logged In" state gracefully (redirect to login).
2.  **Update Prediction Flow**:
    *   Ensure users are logged in before they can submit a question.
    *   Add a "Login to Save History" prompt if necessary.

## Phase 4: Data Migration (Optional but Recommended)
1.  **Link Anonymous Data**:
    *   If a `mmv_user_id` exists in `localStorage`, offer to link those predictions to the new account upon first login.

## Success Criteria
- [ ] `StaticUserManager` is completely removed from the codebase.
- [ ] Users can only see their own predictions.
- [ ] `/profile` page loads data correctly using the authenticated session.
- [ ] No more `Unauthorized` errors in the console.

---
**Oracle Note**: This plan prioritizes security by moving identity verification from the client to the server.
