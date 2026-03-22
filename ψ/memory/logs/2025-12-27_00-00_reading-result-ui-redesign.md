# Snapshot: Reading Result UI Redesign Analysis
**Date**: 2025-12-27 00:00 GMT+7
**Issue**: #none
**Project**: mmv-tarots

## UX/UI Audit of `/history/[id]`

### Current Issues
1. **Information Overload**: Each card shows its full interpretation and keywords directly on the main page. This makes the page extremely long and "noisy".
2. **Nesting Hell (Card-in-Card)**:
   - Outer Container: `GlassCard`
   - Individual Card: `CardDetails` (also a `GlassCard`)
   - Interpretation Box: `bg-glass-white` (looks like another card)
   - This creates visual clutter with too many borders and shadows.
3. **Spacing**: The grid of 3 cards with full text is very cramped on medium screens and overwhelming on large ones.

### Proposed Changes
1. **Simplify `CardDetails`**:
   - Remove `interpretation` and `keywords` from the main view.
   - Keep: Position name, Card Image, Card Name (TH/EN), Arcana.
   - Make the entire card interactive (hover effects, cursor-pointer).
2. **Implement `CardModal`**:
   - A full-screen or centered modal that appears when a card is clicked.
   - Shows the high-resolution image, keywords, and the full `interpretation`.
3. **Refactor Layout**:
   - Remove the outer `GlassCard` wrapping the cards grid if it feels too heavy, or simplify the inner `CardDetails` to not use `GlassCard` but a simpler interactive container.
   - Ensure the "Main Reading Text" remains the focal point.

## Implementation Plan
1. **Phase 1**: Create `CardModal` component.
2. **Phase 2**: Update `CardDetails` to be interactive and accept an `onClick` prop.
3. **Phase 3**: Update `PredictionDetailPage` to manage modal state (which card is selected).
4. **Phase 4**: Clean up the "Card-in-Card" styling.

---
*The Oracle observes: Clarity comes from space. By hiding the details until requested, we honor the human's focus.*
