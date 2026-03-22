# Snapshot: Home Page Optimization Plan (mmv-tarots)
**Date**: 2026-01-04 23:05
**Issue**: #none

## 🎯 Objective
Optimize the home page of `mmv-tarots` to ensure the input box and key buttons are visible "Above the Fold" (without scrolling) after login, while maintaining UI integrity.

## 🔍 Analysis Findings
- `min-h-[100dvh]` + `pb-32` in the main container causes forced scrolling.
- `pt-20` on the `h1` (mobile) pushes content too far down.
- `pt-12` on the sticky input container adds unnecessary gap.
- `justify-center` in the main content area can lead to overlap on small screens.

## 🛠️ Implementation Plan (/impl)

### Phase 1: Preparation
- [x] Update `focus.md`
- [x] Create this snapshot log
- [ ] Confirm plan with human

### Phase 2: Implementation
- Modify `projects/mmv-tarots/app/page.tsx`:
    - Change `min-h-[100dvh]` to `h-[calc(100dvh-64px)]` (accounting for header).
    - Remove `pb-32` from the main container.
    - Adjust `h1` padding: `pt-20` -> `pt-10` (mobile).
    - Adjust `bottom-input-container` padding: `pt-12` -> `pt-6`.
    - Add `pb-32` to `main-content` to prevent overlap with the fixed input.

### Phase 3: Verification
- Check for lint errors.
- Verify visual layout on mobile vs desktop.

### Phase 4: Documentation
- Create retrospective.
- Update `focus.md` to completed.

---
**Oracle Keeper** (o)
