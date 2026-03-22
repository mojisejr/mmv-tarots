# Implementation Plan: Navigation Refinement & UX Optimization (mmv-tarots)
**Date**: 2025-12-27 23:40
**Status**: Pending Approval
**Target**: 100% Build Pass & Zero Linter Errors

## Phase 1: Setup & Infrastructure
- **Task**: Create feature branch and verify baseline.
- **Actions**:
  - Checkout `feat/navigation-refinement` from `main`.
  - Run initial `npm run lint` and `npm run build` to ensure a clean start.
- **Success Criteria**:
  - Branch created.
  - Baseline build/lint passes.

## Phase 2: Desktop Navigation (Profile Dropdown)
- **Task**: Implement the new Profile Dropdown system.
- **Actions**:
  - Create/Update `ProfileDropdown` component in `components/layout/`.
  - Integrate dropdown into `navbar.tsx`.
  - Add links for History, Package, Profile, and Logout.
- **Success Criteria**:
  - Dropdown opens/closes correctly on Desktop.
  - All links navigate to correct routes.
  - No linter errors in modified files.

## Phase 3: Mobile UX & Contextual Header
- **Task**: Implement dynamic headers and smart back button logic.
- **Actions**:
  - Update `NavigationProvider` to manage `pageTitle` state.
  - Modify `navbar.tsx` to show:
    - **Home**: Logo (Centered).
    - **Main Pages**: Page Title (Centered).
    - **Detail Pages**: Back Button (Left) + Page Title (Centered).
  - Refine Back Button visibility logic (Hide on main sections).
- **Success Criteria**:
  - Mobile header reflects current context correctly.
  - Back button only appears where hierarchical navigation is needed.

## Phase 4: Redundancy Removal & Content Cleanup
- **Task**: Clean up the History Detail page and refine BottomNav.
- **Actions**:
  - Remove manual "กลับไปหน้าประวัติ" buttons from `app/history/[id]/page.tsx`.
  - Update `BottomNav.tsx` to hide on detail pages for an immersive experience.
- **Success Criteria**:
  - No redundant back buttons in content areas.
  - Immersive reading experience on mobile.

## Phase 5: Final Validation & Quality Assurance
- **Task**: Ensure production readiness.
- **Actions**:
  - Run full `npm run build`.
  - Run full `npm run lint`.
  - Manual walkthrough of all navigation flows (Desktop & Mobile).
- **Success Criteria**:
  - **100% Build Pass**.
  - **Zero Linter Errors**.
  - Smooth navigation transitions across all devices.

---
**Commitment**: Every commit will be checked for linting and type safety. No changes will be merged to main without human approval.
