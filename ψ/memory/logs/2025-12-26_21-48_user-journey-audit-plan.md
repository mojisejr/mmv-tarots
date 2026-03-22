# Snapshot: User Journey & Page Connectivity Audit Plan
**Date**: 2025-12-26 21:48 GMT+7
**Project**: mmv-tarots
**Status**: Planning Complete

## Context
After auditing the current state of `mmv-tarots`, several navigation inconsistencies and UX gaps were identified:
1. Inconsistent Navbar (Hamburger vs Back button).
2. Missing navigation states for `package` and `result` pages.
3. Lack of feedback after Stripe payment redirects.
4. Redundant content between Profile and History pages.
5. Immersive experience gap in the Waiting page (`/submitted`).

## Implementation Plan: Unified Oracle Journey

### Phase 1: Navigation Infrastructure & Unified UI
**Goal**: Create a consistent navigation experience across all devices.
- **Tasks**:
    - Update `NavigationProvider` to include `package` and `result` states.
    - Refactor `Navbar` to use the new Logo image and unify the left button (Back only, no Hamburger).
    - Update all pages to sync their `currentPage` state correctly.
- **Success Criteria**:
    - Navbar shows Back button on all pages except Home.
    - Logo acts as Home button.
    - No more Hamburger menu on Desktop.
- **Precautions**: Ensure `router.back()` logic doesn't trap users in loops (e.g., between `/submitted` and `/history`).

### Phase 2: Payment Feedback & Journey Refinement
**Goal**: Close the loop on the payment journey and improve the waiting experience.
- **Tasks**:
    - Implement a Toast/Notification system (or use existing if available).
    - Add logic to `/profile` and `/package` to detect `success` or `canceled` query params and show feedback.
    - Hide `BottomNav` on the `/submitted` page.
- **Success Criteria**:
    - User sees a "Success" message after buying Stars.
    - User cannot navigate away easily from the Waiting page via BottomNav.
- **Precautions**: Ensure the `success` param is cleared or handled so the toast doesn't reappear on refresh.

### Phase 3: Content Organization & Cleanup
**Goal**: Clarify the purpose of Profile vs. History pages.
- **Tasks**:
    - Refactor `/profile` to focus on Account/Stars. Show only "Recent 3 Predictions".
    - Ensure `/history` is the primary destination for all past readings.
    - Improve the "Back" logic from `/history/[id]` to always return to `/history`.
- **Success Criteria**:
    - Clear distinction between "My Account" and "My Journey".
    - Seamless transition between list and detail views.
- **Precautions**: **Database Impact** - No schema changes required. However, ensure that fetching "Recent 3" in Profile doesn't conflict with the full list fetch in History (use efficient Prisma queries).

## Database Impact Summary
- **Schema**: No changes needed.
- **Data Integrity**: No risk to existing predictions or user data.
- **Performance**: Minimal impact. Fetching limited records for the Profile page will actually improve initial load time compared to fetching the full history.

## Success Criteria (Overall)
- [ ] Unified Navbar across all pages.
- [ ] Correct Back button behavior in all contexts.
- [ ] Clear payment feedback loop.
- [ ] Improved focus during the AI generation phase.
