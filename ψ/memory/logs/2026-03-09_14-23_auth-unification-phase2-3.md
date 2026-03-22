# Snapshot: Auth Unification Phase 2+3 Complete (Gateway-Only LIFF + Cleanup)

**Time**: 2026-03-09 14:23 +0700
**Context**: Executed `ggg` Phase 2 and Phase 3 from plan `auth-unification-better-auth-king` to enforce LIFF SDK initialization only at gateway route and remove obsolete provider-based bootstrap flow.

## Evidence
- `rg` verification shows `liff.init()` remains only in `app/liff/page.tsx`
- Removed dead code file: `components/providers/liff-provider.tsx`
- Local commit: `203aeb4`
- Hard Gate:
  - `npm run build` passed
  - `npm run lint` passed
  - `bun run test` passed (`134/134`)

## Apply When
- Migration from hybrid LIFF + app-wide provider pattern to gateway-only LIFF bootstrap
- Repeated auth noise appears on non-gateway routes due to accidental global LIFF init

## Next Actions
- Run browser verification on production/preview to confirm homepage no longer emits LIFF endpoint mismatch warning.
- If homepage logs are clean, proceed to final QA and merge sequence by branch policy.

## Tags
`snapshot` `mmv-tarots` `auth-unification` `phase2` `phase3` `better-auth` `liff`