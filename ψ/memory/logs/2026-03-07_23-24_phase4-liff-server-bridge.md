# Snapshot: MMV Tarots Phase 4 LIFF Server Bridge

**Time**: 2026-03-07 23:24:38 +07
**Context**: Implemented Phase 4 (Server Side) bridge for LIFF token verification and Better-Auth-compatible session establishment on branch `staging`.

## Tags
`mmv-tarots` `phase4` `line-liff` `better-auth` `server-bridge` `auth`

## Implementation Results
- Added API route: `app/api/auth/liff-verify/route.ts`.
- Verified LIFF access token against `https://api.line.me/oauth2/v2.1/verify`.
- Validated LINE profile via `https://api.line.me/v2/profile`.
- Mapped LINE identity to local user/account in Prisma (`user` + `account` with `providerId: line`).
- Created server session in `session` table (7-day expiry).
- Issued signed Better-Auth session cookie (`mmv_auth.session_token`) using `serializeSignedCookie` with `BETTER_AUTH_SECRET`.

## Evidence
- Checkpoint commit: `b775138`
- Phase 4 commit: `1406706`
- Validation:
  - `npm run lint` ✅
  - `npm run build` ✅
  - `npm run test` ❌ baseline failures remain (`61 failed files / 92 failed tests`)

## Risks & Notes
- Test suite is not green at baseline, so hard gate for “100% pass” is blocked by pre-existing failures unrelated to this patch.
- Current route trusts LIFF access token + profile endpoint and binds user by LINE userId; this is aligned with LIFF flow but still depends on valid channel alignment (`LINE_CHANNEL_ID`).

## Next Actions
- Optional hardening: add nonce/id-token verification path when LIFF ID token is available.
- Optional quality: add API test coverage for `/api/auth/liff-verify` success/failure cases.
