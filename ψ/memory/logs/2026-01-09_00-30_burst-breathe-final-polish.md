# Snapshot: The "Burst & Breathe" Final Polish & Troubleshooting

**Time**: 2026-01-09 00:30
**Context**: Successfully completed the implementation of the spiritual rate-limiting system for `mmv-tarots` and resolved critical caching and sync issues.

## 🌈 The Journey: Fixed Problems & Solutions

### 1. The "Invisible Refill" (The Caching Wall)
- **Problem**: Users wait for 45s, but the quota `🔮` doesn't update unless they reload the page or ask a question.
- **Cause**: Next.js App Router aggressively caches GET requests in Route Handlers. The API returned the same stale state constantly.
- **Solution**: 
    - Forced the API to be dynamic via `export const dynamic = 'force-dynamic'`.
    - Added explicitly non-cache headers to the response.
    - Updated Fetch call with `cache: 'no-store'`.

### 2. The "Floating Point Precision" Bug
- **Problem**: Logic sometimes returns `2` instead of `3` because calculations result in `2.99999997`.
- **Solution**: Implemented precision rounding (`Math.round(tokens * 1000) / 1000`) before calling `Math.floor()`.

### 3. The "Static UI" vs "Live Soul"
- **Problem**: Quota state didn't reflect real-time recovery.
- **Solution**: 
    - **Auto-Polling**: The `NavigationProvider` now polls the balance API every 10 seconds only when quota is depleted.
    - **Manual Refresh**: Added a subtle `RotateCw` icon next to the crystal balls for manual "spiritual concentration" requests.

### 4. The "Syntax Duplication" Error (Post-Implementation)
- **Problem**: Error "Expected '</', got 'flex'" on page load.
- **Cause**: Accidental code duplication during `replace_string_in_file` operation, leading to broken JSX tags.
- **Solution**: Cleaned up the `QuestionInput.tsx` file by removing redundant blocks.

## 🚀 Final Feature Set
- **Burst Capacity**: 3 Questions.
- **Natural Refill**: 1 slot per 45 seconds.
- **Breathe Delay**: 30s forced rested after a burst.
- **Live Sync**: UI updates automatically every 10s or via manual refresh button.

## Tags
`final-polish` `bug-fix` `token-bucket` `ux-improvement` `spiritual-logic` `mmv-tarots`
