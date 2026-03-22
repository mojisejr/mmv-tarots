# Snapshot: Burst & Breathe UI Fix & Lessons Learned

**Time**: 2026-01-08 23:45
**Context**: Successfully fixed the "Invisible Crystal Balls" issue and finalized the Burst & Breathe cooldown system for `mmv-tarots`.

## The Implementation

- **Algorithm**: Stateless Token Bucket using 3 slots and 45s refill rate.
- **Frontend**: `QuestionInput` now displays `🔮🔮🔮` at the top-left alongside the character counter.
- **UX**: Crystal balls dim (opacity 0.2) when consumed and glow (opacity 1.0 + drop-shadow) when active.

## ⚠️ Post-Mortem: Why the Crystal Balls were "Invisible"?

I made two significant technical oversights during the first implementation attempt:

1.  **Wrong Source of Truth**: I updated the `/api/user/me` endpoint to return concentration data, but the main application fetch logic in `NavigationProvider` actually relies on `/api/credits/balance`. This led to the state being `null` despite the backend logic being ready.
2.  **Missing Component Linkage**: I added the `concentration` prop to the `QuestionInput` component and passed it in `app/page.tsx`, but I forgot to actually **extract** the variable from the `useNavigation()` hook at the top of the `Home` function. 

**Result**: The component received `undefined`, causing the balls to hide (while the separator `|` stayed visible because its condition was slightly different in the first pass).

## Final Polish
- Fixed `app/api/credits/balance/route.ts` to include concentration data.
- Correctly destructured `concentration` from `useNavigation()` in `app/page.tsx`.
- Ensured `refreshBalance()` is called after every successful prediction to update the UI immediately.

## Verified Visibility
- [x] Initial load: 🔮🔮🔮 visible.
- [x] Focus state: Counter + 🔮🔮🔮 visible.
- [x] Post-submit: Propagates to 2/3 🔮🔮.

## Tags
`bug-fix` `lessons-learned` `ui-integration` `token-bucket` `mmv-tarots`
