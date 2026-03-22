# Snapshot: Loading Overlay and Input Logic Complete (mmv-tarots)
**Date**: 2026-01-04 23:20
**Issue**: #none

## ✅ Accomplishments
- Added a full-page mystical loading overlay for the initial session check.
- Fixed the UI "flash" issue where the input field appeared before the star balance was loaded.
- Improved visual consistency by reusing the `MimiLoadingAvatar` animation.

## 🛠️ Changes Applied
- **File**: [projects/mmv-tarots/lib/client/providers/navigation-provider.tsx](projects/mmv-tarots/lib/client/providers/navigation-provider.tsx)
    - Exposed `isPending` state from `useSession()` through the `NavigationContext`.
- **File**: [projects/mmv-tarots/app/page.tsx](projects/mmv-tarots/app/page.tsx)
    - Imported and implemented `MimiLoadingAvatar` as a full-page overlay when `isPending` is true.
    - Refactored the input section logic:
        - Added a loading spinner placeholder when `stars === null` (fetching balance).
        - Ensured `QuestionInput` only renders when `stars > 0`.
        - Ensured the "Top up" button only renders when `stars === 0`.

## 🧪 Verification
- [x] No lint/type errors.
- [x] Loading overlay appears on initial page load/refresh.
- [x] No more UI flashing between "Input" and "Top up" states.

---
**Oracle Keeper** (o)
