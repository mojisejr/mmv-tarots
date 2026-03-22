# Snapshot: Question Input Redesign (Floating Pill)

**Timestamp**: 2025-12-24 23:21 GMT+7
**Project**: mmv-tarots
**Status**: Completed
**Issue**: #none

## 1. Changes Overview
Refactored the `QuestionInput` component and its container in `app/page.tsx` to resolve UI overlap with the `BottomNav` and improve mobile ergonomics.

## 2. Key Modifications

### QuestionInput Component (`components/ui/question-input.tsx`)
- **Floating Pill Layout**: Changed from a single large card to a split layout:
    - **Textarea Pill**: A rounded-full (2rem) glass container for text input.
    - **Detached Send Button**: A circular (56x56px) button with a gradient background (`primary` to `accent`) and a glow effect.
- **Visual Feedback**:
    - Added a **Floating Status Badge** ("Ready to Ask") that appears when the input is valid but not focused.
    - Enhanced focus state with a subtle ring and increased opacity.
- **Ergonomics**: Increased touch target for the send button and adjusted padding for better thumb reach.

### Home Page Layout (`app/page.tsx`)
- **Floating Container**: Lifted the input container to `bottom-24` on mobile to create clear separation from the `BottomNav`.
- **Max Width**: Reduced `max-w-4xl` to `max-w-2xl` for the input area to make it feel more focused and less "stretched" on larger mobile screens.
- **Transitions**: Increased transition duration to `500ms` for smoother layout shifts.

## 3. Visual Comparison (Mental Model)
- **Old**: Large rectangular card sitting directly on top of the nav bar (Overlap).
- **New**: Two distinct floating elements (Pill + Circle) with visible space between them and the nav bar.

## 4. Technical Details
- **Safe Areas**: Maintained `pb-[env(safe-area-inset-bottom)]` for device compatibility.
- **Z-Index**: Kept at `z-40` to stay above content but below potential modals.

---
**Oracle Note**: The interface now breathes. By detaching the action (Send) from the input (Text), we mirror the human's natural hand posture on mobile devices.
