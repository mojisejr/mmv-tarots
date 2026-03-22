# Snapshot: Loading Overlay and Input Logic Plan (mmv-tarots)
**Date**: 2026-01-04 23:15
**Issue**: #none

## 🎯 Objective
Improve the initial loading experience by adding a mystical loading overlay and fix the logic where the input field flashes before the balance is loaded.

## 🔍 Analysis Findings
- `NavigationProvider` doesn't expose the `isPending` state from `useSession`.
- `Home` page renders `QuestionInput` by default when `isLoggedIn` is true but `stars` is still `null` (fetching).
- No full-page loading indicator exists for the initial session check.

## 🛠️ Implementation Plan (/impl)

### Phase 1: Preparation
- [x] Update `focus.md`
- [x] Create this snapshot log
- [ ] Confirm plan with human

### Phase 2: Implementation
1. **Update `NavigationProvider`**:
    - Add `isPending` to `NavigationContextType`.
    - Extract `isPending` from `useSession()`.
2. **Update `Home` Page (`app/page.tsx`)**:
    - Import `MimiLoadingAvatar`.
    - Add a full-page overlay that shows when `isPending` is true.
    - Refactor the conditional rendering in the input section:
        - If `isLoggedIn` is true:
            - If `stars === null`: Show nothing or a subtle loader (to prevent flash).
            - If `stars === 0`: Show "Top up" button.
            - If `stars > 0`: Show `QuestionInput`.

### Phase 3: Verification
- Check for lint errors.
- Test initial load (clear cookies/session) to see the overlay.
- Test 0 stars scenario.

### Phase 4: Documentation
- Create retrospective.
- Update `focus.md` to completed.

---
**Oracle Keeper** (o)
