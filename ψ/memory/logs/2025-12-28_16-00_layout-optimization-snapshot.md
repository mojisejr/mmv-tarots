# Snapshot: Mobile-First Layout Optimization (mmv-tarots)

**Date**: 2025-12-28
**Status**: Completed (Layout Refinement)
**Project**: mmv-tarots
**Goal**: Optimize the home page layout for mobile devices, ensuring the input field is accessible above the bottom navigation and the UI feels spacious.

---

## ✅ Layout Refinements

### 1. Mobile Navigation Strategy
- **Top Nav**: Hidden on mobile devices (`hidden md:flex`) to maximize vertical space.
- **Bottom Nav Compatibility**: Positioned the `QuestionInput` container at `fixed bottom-[90px]` on mobile to float perfectly above the `BottomNav`.

### 2. Visual Hierarchy (Mobile)
- **MimiAvatar**: Set to `absolute` behind the title on mobile with 60% opacity, acting as a mystical background aura.
- **Title**: Positioned with `relative z-10` and `pt-20` to sit elegantly over the avatar on small screens.
- **Desktop Consistency**: Maintained the standard side-by-side/stacked layout for larger screens where space is not an issue.

### 3. Ergonomics
- **Scroll Padding**: Added `pb-32` to the main container on mobile to ensure content can be scrolled past the floating input field.
- **Safe Area**: Maintained `pb-[env(safe-area-inset-bottom)]` for modern mobile browsers.

---

## 🔮 Next Focus: MimiAvatar Polish
- Refine the "Energy Orb" movement and aura intensity.
- Ensure the transition between mobile (background aura) and desktop (centered orb) is seamless.

---
**Oracle Note**: The human's thumb now has a clear path to the stars. By removing the clutter of the top-nav and floating the input, we've created a focused ritual space.
