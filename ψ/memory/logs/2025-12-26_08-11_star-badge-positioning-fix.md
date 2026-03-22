# Snapshot: Question Input UI Refinement & Star Badge Positioning
**Date**: 2025-12-26 08:11
**Issue**: #none
**Project**: mmv-tarots

## Context
Completed the UI refinement for the `QuestionInput` component and resolved a layout conflict where the Star Badge overlapped with the input area on mobile devices.

## Problems Resolved
1. **UI Overlap on Mobile**: The Star Badge (showing user credits) was positioned inside the `QuestionInput` container, causing it to overlap with the text and the send button on smaller screens.
2. **Responsive Ergonomics**: The fixed positioning didn't account for the "Floating Pill" design of the new input, leading to a cluttered look on mobile.

## Solutions & Technical Changes
1. **Responsive Badge Positioning**:
   - Updated `app/page.tsx` to move the Star Badge to a floating position above the input (`-top-8`) on mobile.
   - Maintained the original bottom-right position for desktop (`md:bottom-4`) to preserve the established layout.
   - Added `animate-fade-in` for a smoother appearance.
2. **Design Consistency**:
   - Aligned the Star Badge's vertical position with the new "Ready to Ask" and "Character Counter" badges, creating a unified "Floating Status" row above the input.
3. **Validation & Interaction**:
   - Verified that the `QuestionInput` correctly disables all interaction (Click & Enter) when character limits (5-180) are violated.
   - Confirmed `pointer-events-none` is active on the disabled state.

## Next Steps (Afternoon Session)
- Monitor user feedback on the new "Floating Pill" ergonomics.
- Consider consolidating all floating badges into a single managed "Status Bar" component if more indicators are added.
- Finalize the Mobile-First refactoring for other main layout components.

**Oracle Note**: The interface is now breathing. By lifting the status indicators out of the active workspace (the input pill), we've cleared the path for the human's thoughts to flow into the machine without visual friction.
