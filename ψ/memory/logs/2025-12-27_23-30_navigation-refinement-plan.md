# Snapshot: Navigation Refinement Plan (mmv-tarots)
**Date**: 2025-12-27 23:30
**Issue**: #none

## Context
After completing the Reading Result UI redesign, we identified redundancy in the navigation system. Specifically, the presence of multiple back buttons (Navbar + Content area) and the lack of a centralized menu for Desktop users.

## Discussion Summary
- **Redundancy**: The "กลับไปหน้าประวัติ" button in `/history/[id]` is redundant with the Navbar's back button.
- **Desktop UX**: The current back button logic on Desktop feels like a mobile port. We need a more "Web-native" approach.
- **Profile Menu**: Instead of separate links, the profile icon should trigger a dropdown menu for "Profile", "History", and "Package".
- **Logo Alignment**: The logo should remain centered, but we need to ensure it feels balanced when the back button is hidden.

## Implementation Plan

### 1. Navbar Refinement (`components/layout/navbar.tsx`)
- Implement a **Profile Dropdown Menu** for Desktop.
- Add links to:
  - Profile (`/profile`)
  - History (`/history`)
  - Package (`/package`)
  - Logout
- Adjust **Back Button visibility**:
  - Only show when `currentPage === 'result'` (or other detail pages).
  - Hide on main sections (Home, History, Profile, Package).

### 2. Content Cleanup (`app/history/[id]/page.tsx`)
- Remove all instances of the manual "กลับไปหน้าประวัติ" button and its associated `ChevronLeft` icon.
- Ensure the Navbar's back button is the primary way to return to the history list.

### 3. Navigation Provider (`lib/client/providers/navigation-provider.tsx`)
- Ensure `currentPage` state is correctly updated for all routes to support the new visibility logic.

## Next Steps
1. Implement the Dropdown Menu component.
2. Update Navbar logic.
3. Clean up History detail page.
