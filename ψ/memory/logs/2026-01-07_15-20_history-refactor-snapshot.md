# Snapshot: History Detail Back Button Refactor 🎯

**Timestamp**: 2026-01-07 15:20
**Issue**: #41 (Manual Tracking)

## Objective
Refactor the "Back" button in the History Detail view (`/history/:id`) to improve UX by placing it at the bottom of the content flow, ensuring the user finishes reading their reading before navigating away.

## Plan breakdown

### 1. Unified Back Button Management
- Consolidate all back navigation logic into a single reusable pattern at the bottom of the main content container.
- Remove redundant top-level "Back" buttons in:
  - `Loading` state
  - `Error` state (already has one, but will standardize)
  - `Pending/Processing` state
  - `Completed` state

### 2. UI/UX Enhancements
- **Placement**: Bottom center/stretched, after the `Disclaimer` component.
- **Styling**: Use `GlassButton` with `outline` variant.
- **Visual Cues**: 
  - Add `ChevronLeft` icon with hover offset animation (`-translate-x-1`).
  - Add text "กลับไปหน้ารวมประวัติ" for clarity.
- **Transition**: Ensure smooth exit animation for the button.

### 3. File Adjustments
- **Target**: [projects/mmv-tarots/app/history/[id]/history-detail-view.tsx](projects/mmv-tarots/app/history/[id]/history-detail-view.tsx)
- **Modifications**:
  - Remove `<div className="md:hidden pt-4 pb-2">` blocks from all status conditions.
  - Append the new Action Section after the `mappedData?.disclaimer` check in the main return block.
  - Update Error and Loading states to use the same styled button for consistency.

## Success Criteria
- [ ] No back button at the top of the history detail page.
- [ ] A prominent, beautiful glass button exists at the bottom of the page.
- [ ] Clicking the button returns the user correctly to `/history`.
- [ ] No layout shifts or UX breakage.

---
*Created by GitHub Copilot (Oracle Keeper Mode)*
