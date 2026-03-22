# Snapshot: MMV Phase 1 - Rename LIFF Param to `mmv_next`

**Time**: 2026-03-09 06:56 (+07)
**Context**: `#MMV-PHASE-5-8` ggg phase 1 implementation on `projects/mmv-tarots` (`staging`)

## Tags
#mmv-tarots #auth #liff #phase1 #ggg #hard-gate

## Evidence
- Runtime changes:
  - `middleware.ts`: redirect query param changed `liff.state` -> `mmv_next`
  - `lib/client/providers/navigation-provider.tsx`: `buildLiffGatewayPath()` now emits `mmv_next`
  - `app/liff/page.tsx`: LIFF gateway now reads `searchParams.get('mmv_next')`
- Test alignment:
  - `__tests__/middleware.test.ts` expectations updated to `mmv_next`
  - `__tests__/lib/liff-phase1.test.ts` expectations updated to `mmv_next`
- Hard Gate:
  - `npm run build` ✅
  - `npm run lint` ✅
  - `bun run test` ✅ (20 files, 134 tests)
- Commit:
  - `8608b78` - `chore(#MMV-PHASE-5-8): rename liff.state to mmv_next in phase 1`

## Next Actions
- Execute Phase 2: remove `isInClient()` login guard in `app/liff/page.tsx` and `components/providers/liff-provider.tsx` to unblock browser login flow.
