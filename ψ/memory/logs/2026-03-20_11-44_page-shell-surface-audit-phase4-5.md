# Snapshot: PageShell Surface Audit & Tests (Phase 4+5) — mmv-tarots

**Time**: 2026-03-20 11:44 +0700
**Context**: Implemented Phase 4 (Surface Audit) and Phase 5 (Hard Gate) of the mmv-mobile-bottom-nav remediation plan. Created shared PageShell component, migrated 6 standard pages, and added 22 regression tests.

---

## Evidence

### PageShell Component Created
- `components/layout/page-shell.tsx`: Shared page wrapper handling `mx-auto`, `px-4`, `pt-10`, configurable `maxWidth`
- Exported from `components/layout/index.ts` barrel
- Bottom clearance handled by root layout `<main>` via `--mobile-bottom-clearance` token — pages do NOT need their own reserve

### Pages Migrated to PageShell
- `app/package/page.tsx` → `<PageShell>` (maxWidth default 4xl)
- `app/billing/page.tsx` → `<PageShell>` (maxWidth default 4xl)
- `app/transactions/page.tsx` → `<PageShell>` (maxWidth default 4xl)
- `app/policy/privacy/page.tsx` → `<PageShell maxWidth="3xl" className="md:pt-14">`
- `app/policy/refund/page.tsx` → `<PageShell maxWidth="3xl" className="md:pt-14">`
- `app/policy/terms/page.tsx` → `<PageShell maxWidth="3xl" className="md:pt-14">`

### Tests Added (22 total, all pass)
- `__tests__/page-shell.test.tsx`: 5 unit tests for PageShell rendering, maxWidth, className merging
- `__tests__/surface-audit.test.ts`: 17 regression tests
  - Banned patterns (pb-24, pb-28, z-50, bottom-24) absent from all 6 standard pages
  - All 6 pages import PageShell
  - globals.css contains required spacing + z-layer tokens
  - bottom-nav.tsx and modal.tsx use token-based z-index
  - root layout uses `--mobile-bottom-clearance`

### Hard Gate Results
- **Build**: ✅ Pass
- **Lint**: ✅ Pass
- **Tests**: ✅ 22/22 new tests pass (2 pre-existing failures unrelated — @react-three/fiber `extend` mock)

### Commit
- `a81efbd` on branch `staging` (copiloting)
- 10 files changed, 195 insertions, 19 deletions

## Apply When
- Future pages under BottomNav should use `<PageShell>` instead of manual div wrappers
- Any new page that needs mobile-safe bottom clearance inherits it from root layout automatically
- When adding anti-patterns like `pb-24` or `z-50`, the surface-audit test will catch it

## Next Actions
- Manual smoke test on mobile viewports (375x667, 390x844, 430x932) before deploy
- Consider fixing the 2 pre-existing test failures (`extend` mock issue in @react-three/fiber)
- All 5 phases of the remediation plan are now ✅ DONE

## Tags
`snapshot` `sss` `mmv-tarots` `page-shell` `surface-audit` `phase4` `phase5` `regression-tests` `mobile-safe`
