# Snapshot: Mobile & LINE LIFF UX Optimization (mmv-tarots)
**Date**: 2025-12-27 23:37
**Issue**: #none

## Context
To ensure a seamless experience between Desktop and Mobile (especially for LINE LIFF), we need to align the navigation logic while respecting mobile-specific constraints.

## Mobile UX Strategy (LINE LIFF Focused)

### 1. Contextual Navbar (Header)
- **Home**: Show Logo (Centered).
- **Main Pages (History, Profile, Package)**: Show Page Title (Centered) instead of Logo to provide clear context. No Back button (use BottomNav).
- **Detail Pages (History Detail)**: Show Back Button (Left) + Page Title (Centered).

### 2. Smart Back Button Logic
- Align with Desktop: Only show the Back button when there is a clear hierarchical "Up" action.
- This prevents the "Back to Home" loop when the user can already use the BottomNav or Logo.

### 3. Bottom Navigation (The Anchor)
- **Primary Nav**: Home, History, Package, Profile.
- **Visual Feedback**: Ensure active states are clear and transitions are smooth.
- **Safe Area**: Maintain strict adherence to `env(safe-area-inset-bottom)` for LINE LIFF compatibility on various devices.

### 4. Immersive Reading Experience
- Consider hiding the `BottomNav` on the Reading Result page (`/history/[id]`) to give maximum vertical space for the tarot cards and interpretation, similar to how it's hidden on the `/submitted` page.

## Implementation Plan
1. Update `navbar.tsx` to support dynamic titles based on `currentPage`.
2. Refine `BottomNav.tsx` visibility logic.
3. Sync `navigation-provider.tsx` to handle mobile-specific title states.
