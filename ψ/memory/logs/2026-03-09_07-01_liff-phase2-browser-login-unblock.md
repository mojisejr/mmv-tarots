# Snapshot: MMV Phase 2 - Browser Login Guard Unblocked

**Time**: 2026-03-09 07:01 (+07)
**Context**: `#MMV-PHASE-5-8` ggg phase 2 on `projects/mmv-tarots` (`staging`)

## Tags
#mmv-tarots #liff #auth #phase2 #browser-login #ggg

## Evidence
- Updated login guard in `app/liff/page.tsx`:
  - from `if (liff.isInClient() && !liff.isLoggedIn())`
  - to `if (!liff.isLoggedIn())`
- Updated login guard in `components/providers/liff-provider.tsx`:
  - removed client-only gate and now calls `liff.login()` whenever LIFF session is not logged in
- Commit created:
  - `bc9b826` - `fix(#MMV-PHASE-5-8): remove isInClient guard to unblock browser login`
- Hard Gate status:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (20 files, 134 tests)

## Next Actions
- Execute Phase 3: prevent double-init race by skipping `LiffProvider` bootstrap on `/liff` route via `usePathname()` guard.
