# Snapshot: Auth Unification Phase 1 Complete (Global LiffProvider Removal)

**Time**: 2026-03-09 14:20 +0700
**Context**: Executed `ggg` Phase 1 from plan `auth-unification-better-auth-king` to stop global LIFF SDK initialization conflict with Better-Auth session flow on homepage.

## Evidence
- Code change committed in `projects/mmv-tarots/app/layout.tsx`
- Global `<LiffProvider>` wrapper removed from root layout tree
- Local commit: `09b57bb`
- Hard Gate results:
  - `npm run build` passed
  - `npm run lint` passed
  - `bun run test` passed (`134/134`)

## Apply When
- Homepage shows LIFF warning: `liff.init() was called with a current URL that is not related to the endpoint URL`
- Repeated unauthorized call noise appears on `/api/auth/liff-verify` outside `/liff` flow
- Project needs single auth authority with Better-Auth as canonical session holder

## Next Actions
- Phase 2: keep LIFF bootstrap only in `app/liff/page.tsx` gateway and verify Browser + LIFF client handoff.
- Validate in real browser logs that homepage no longer initializes LIFF SDK after deployment.

## Tags
`snapshot` `mmv-tarots` `auth-unification` `better-auth` `liff` `phase1`