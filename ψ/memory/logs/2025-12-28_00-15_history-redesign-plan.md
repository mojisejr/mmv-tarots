# Snapshot: History Page Redesign Plan
**Date**: 2025-12-28 00:15 GMT+7
**Issue**: #none
**Project**: mmv-tarots

## Current State Audit
- **Layout**: Fixed `max-w-md` (mobile-only feel).
- **Visuals**: Plain list of horizontal cards.
- **Theme**: Lacks the "Sai Mu" (mystical) atmosphere established in recent refactors.
- **Responsiveness**: Does not utilize desktop screen real estate.

## Proposed Design (Sai Mu Style)
1.  **Responsive Grid**:
    - Mobile: 1 column.
    - Tablet: 2 columns.
    - Desktop: 3 columns.
    - Container: `max-w-6xl`.
2.  **Minimal Control Bar (Single Line)**:
    - **Search**: Integrated glass input with a mystical search icon.
    - **Filter/Sort**: Subtle dropdowns or icon-based toggles (Status, Date).
    - Style: Ultra-thin glassmorphism to keep it "minimal".
3.  **HistoryCard Evolution**:
    - Change from horizontal list item to a vertical "Tarot Card" style.
    - Add card previews (miniature card backs or drawn cards).
    - Use `GlassCard` with enhanced mystical borders.
    - Improve typography (Serif for titles, Mono for IDs).
4.  **Atmosphere**:
    - Add a subtle mystical background to the history container.
    - Use `framer-motion` for staggered entry animations.

## ASCII Layout
```text
+-----------------------------------------------------------------------+
|                           [ Navigation Bar ]                          |
+-----------------------------------------------------------------------+
|                                                                       |
|                          ✨ YOUR JOURNEY ✨                           |
|                                                                       |
|   [ 🔍 Search visions...                 ] [ All ▾ ] [ Newest ▾ ]     |
|                                                                       |
|  +-------------------+   +-------------------+   +-------------------+|
|  |   [ CARD ICON ]   |   |   [ CARD ICON ]   |   |   [ CARD ICON ]   ||
|  |                   |   |                   |   |                   ||
|  | "Will I find love"|   | "Career path?"    |   | "Travel plans?"   ||
|  |                   |   |                   |   |                   ||
|  | [Status: Done]    |   | [Status: Pending] |   | [Status: Done]    ||
|  | 2 hours ago       |   | 5 hours ago       |   | 1 day ago         ||
|  +-------------------+   +-------------------+   +-------------------+|
|                                                                       |
|  +-------------------+   +-------------------+   +-------------------+|
|  |   [ CARD ICON ]   |   |   [ CARD ICON ]   |   |   [ CARD ICON ]   ||
|  |                   |   |                   |   |                   ||
|  | "New house?"      |   | "Health check"    |   | "Friendship"      ||
|  |                   |   |                   |   |                   ||
|  | [Status: Done]    |   | [Status: Done]    |   | [Status: Done]    ||
|  | 2 days ago        |   | 3 days ago        |   | 1 week ago        ||
|  +-------------------+   +-------------------+   +-------------------+|
|                                                                       |
+-----------------------------------------------------------------------+
```

## Implementation Steps
1.  Create a `HistoryControls` component for Search/Filter/Sort.
2.  Modify `HistoryCard` to support the new vertical/mystical design.
3.  Update `HistoryPage` to use a responsive grid and integrate `HistoryControls`.
4.  Add animations and atmospheric touches.

