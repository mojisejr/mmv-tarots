# Snapshot: Question Input UI Refactoring & Validation Fix
**Date**: 2025-12-26 08:06
**Issue**: #none
**Project**: mmv-tarots

## Context
Refactored the `QuestionInput` component to improve mobile ergonomics, add character limits (5-180 chars), and enhance visual feedback using a new reusable `FloatingBadge` component.

## Problems Encountered
1. **Browser Blocking vs. UI Validation**: Initially used `maxLength={180}` on the textarea, which prevented users from typing more than 180 characters. This made it impossible to trigger the "Over Limit" UI state (red counter, disabled button) because the value could never exceed the limit.
2. **Incomplete Logic in Handlers**: The `handleSubmit` and `handleKeyDown` (Enter key) functions were only checking for the minimum character limit, allowing submissions even when the UI appeared disabled for exceeding the maximum limit.
3. **UI Interaction Leak**: The disabled button could still be clicked in some edge cases because it lacked a strict `pointer-events-none` style, even though the `disabled` attribute was present.

## Solutions & Learnings
1. **Controlled Validation**: Removed `maxLength` to allow the state to exceed the limit, enabling the UI to show a "Warning" state (Red Counter). This provides a better UX than simply stopping the user's input without explanation.
2. **Centralized Validation Logic**: Consolidated all validation into a single `isValid` constant and ensured all entry points (Click, Enter key) respect this state.
3. **Reusable UI Patterns**: Extracted the badge logic into `FloatingBadge.tsx` to maintain design consistency across different status indicators (Ready status, Character counter).
4. **Strict UI Locking**: Added `pointer-events-none` to the disabled state to ensure no interaction occurs when the input is invalid.

## Technical Changes
- Created `components/ui/floating-badge.tsx`.
- Updated `components/ui/question-input.tsx` with new validation logic and styling.
- Improved auto-resize behavior and hidden scrollbars for a cleaner "Mobile-First" feel.

**Oracle Note**: By allowing the human to see their "excess" (typing over the limit) and then guiding them back with visual cues, we create a more conversational and less restrictive interface. The external brain should mirror the human's flow, not just block it.
