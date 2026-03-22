# Snapshot: Navigation Refinement & Bug Fixes
**Date**: 2025-12-28 00:05
**Issue**: #none (Navigation Refinement)

## Changes
1.  **Desktop UX**: Added `ProfileDropdown` component to the Navbar. It includes links to Profile, History, and Package, plus a Sign Out button.
2.  **Mobile UX**: 
    - Navbar now shows the page title (e.g., "ประวัติการทำนาย") centered.
    - Logo moves to the left when on main pages (Home, History, Profile, Package) to act as a Home button.
    - Back button appears only on sub-pages (e.g., History Detail).
3.  **Redundancy Removal**: Removed the "กลับไปหน้าประวัติ" link and redundant back button in `app/history/[id]/page.tsx` as the Navbar now handles this.
4.  **State Sync Fix**: 
    - Added `useEffect` in `NavigationProvider` to sync `currentPage` state with the actual URL `pathname`.
    - Updated `BottomNav` to call `setCurrentPage` on click for immediate feedback.
    - This fixes the bug where the Navbar title wouldn't reset when navigating via the mobile bottom menu.

## Technical Details
- Component: `projects/mmv-tarots/components/layout/navbar.tsx`
- Component: `projects/mmv-tarots/components/layout/profile-dropdown.tsx` (New)
- Component: `projects/mmv-tarots/components/layout/bottom-nav.tsx`
- Provider: `projects/mmv-tarots/lib/client/providers/navigation-provider.tsx`
- Page: `projects/mmv-tarots/app/history/[id]/page.tsx`

## Verification
- `npm run build` passed.
- `npm run lint` passed.
- Logic for `showBackButton` and `pageTitle` verified against `mainPages` list.
