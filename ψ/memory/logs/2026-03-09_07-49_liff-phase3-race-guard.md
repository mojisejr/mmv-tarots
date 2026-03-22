# Snapshot: MMV Phase 3 - LiffProvider Race Guard on `/liff`

**Time**: 2026-03-09 07:49 (+07)
**Context**: `#MMV-PHASE-5-8` ggg phase 3 on `projects/mmv-tarots` (`staging`)

## Tags
#mmv-tarots #liff #auth #phase3 #race-condition #ggg

## Evidence
- Updated `components/providers/liff-provider.tsx`:
  - Added `usePathname` import and `const pathname = usePathname()`
  - Added route guard: skip global LIFF bootstrap when `pathname === '/liff'`
  - Updated effect deps to include `pathname`
- Intent: prevent double-init race between global `LiffProvider` and `/liff` gateway flow.
- Commit:
  - `c535492` - `fix(#MMV-PHASE-5-8): skip liff-provider bootstrap on /liff route to prevent race`
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (20 files, 134 tests)

## Next Actions
- Phase 4 is already covered by prior test alignment for `mmv_next`; run end-to-end manual browser flow verification on `/liff?mmv_next=%2Fprofile` and then proceed to final rollout checkpoint.
