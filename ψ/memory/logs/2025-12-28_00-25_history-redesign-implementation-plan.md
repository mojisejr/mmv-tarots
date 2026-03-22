# Implementation Plan: History Page Redesign (Sai Mu Edition)
**Date**: 2025-12-28 00:25 GMT+7
**Project**: mmv-tarots
**Status**: Pending Approval

## 1. Objectives
Transform the current mobile-centric history list into a responsive, mystical "Sai Mu" grid that utilizes desktop space and provides better discovery tools (Search/Filter/Sort).

## 2. Success Criteria
- [ ] **Responsive Grid**: 1 col (mobile), 2 cols (tablet), 3+ cols (desktop).
- [ ] **Mystical UI**: `HistoryCard` redesigned as a vertical Tarot-style card.
- [ ] **Discovery Tools**: Functional `HistoryControls` (Search by question, Filter by status, Sort by date).
- [ ] **Performance**: Smooth animations using `framer-motion`.
- [ ] **Quality**: 100% Build Pass (`npm run build`).
- [ ] **Quality**: 100% Linter Pass (`npm run lint`).

## 3. Technical Architecture

### A. Components
1.  **`HistoryControls`**: New component in `components/history/history-controls.tsx`.
    - Search Input (Glass style).
    - Status Filter (Dropdown: All, Pending, Completed, Failed).
    - Date Sort (Dropdown: Newest, Oldest).
2.  **`HistoryCard`**: Refactor `components/ui/history-card.tsx`.
    - Change layout to vertical.
    - Add a "Card Preview" area (placeholder for now, or mini card backs).
    - Enhance typography with `font-serif` for questions.
3.  **`HistoryPage`**: Refactor `app/history/page.tsx`.
    - Remove `max-w-md` constraint.
    - Implement `useMemo` for filtering and sorting logic.
    - Wrap grid items in `framer-motion` for staggered entry.

### B. State Management
- Local state in `HistoryPage` for:
    - `searchQuery` (string)
    - `statusFilter` (string)
    - `sortBy` ('newest' | 'oldest')

## 4. Implementation Steps

### Phase 1: Foundation & Controls
1.  Create `components/history/history-controls.tsx`.
2.  Export from `components/index.ts`.
3.  Integrate into `app/history/page.tsx` and verify layout.

### Phase 2: Card Redesign
1.  Update `HistoryCard` CSS/Tailwind classes for vertical layout.
2.  Add mystical decorative elements (borders, subtle glows).
3.  Ensure accessibility (ARIA labels, keyboard navigation).

### Phase 3: Logic & Responsiveness
1.  Implement filtering/sorting logic in `HistoryPage`.
2.  Update grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.
3.  Add `AnimatePresence` and `motion.div` for smooth transitions.

### Phase 4: Verification
1.  Run `npm run lint` and fix any issues.
2.  Run `npm run build` to ensure no regressions.

## 5. Risk Mitigation
- **Regression**: Keep the original `HistoryCard` logic (props/onClick) intact to avoid breaking navigation.
- **Performance**: Use `useMemo` for filtering to prevent unnecessary re-renders on large history sets.

---
*The Oracle observes: Clarity in planning is the first step towards a resonant reality.*
