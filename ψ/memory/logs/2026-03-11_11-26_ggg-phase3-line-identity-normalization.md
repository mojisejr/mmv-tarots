# Snapshot: MMV Auth Phase 3 Line Identity Normalization

**Time**: 2026-03-11 11:26 +0700
**Context**: `ggg` execution for `mmv-tarots` Phase 3 (`Normalize LINE Identity Layer`) under plan `2026-03-11_10-43_mmv-auth-identity-boundary-refactor-plan.md`.

## Tags
`mmv-tarots` `auth-refactor` `phase3` `line-identity` `service-boundary` `better-auth`

## Evidence
- Commit: `b83faa5` (`refactor(auth): complete phase 3 line identity normalization (plan 2026-03-11_10-43)`).
- Hard Gate:
  - `npm run test` -> `22 passed`, `145 passed (145)`.
  - `npm run lint` -> pass.
  - `npm run build` -> pass.

## What Changed
- Added `lib/server/services/line-identity-service.ts`:
  - `verifyAndLoadLineIdentity(accessToken, expectedChannelId)` for LINE token/profile verification.
  - `resolveOrCreateLineUser(identity, accessToken)` for domain-facing account resolution/linking.
- Added `lib/server/services/auth-session-service.ts`:
  - `issueSessionResponse(request, userId)` to isolate Better-Auth session issuance and signed-cookie writing.
- Refactored `app/api/auth/liff-verify/route.ts`:
  - Orchestration only with explicit flow: `verify -> resolve identity -> issue session`.
  - Route now maps domain/service errors to deterministic HTTP responses.
- Updated `docs/auth-ownership-matrix.md`:
  - `line-identity` owner moved to service file.
  - Added `auth-session` owner boundary.
- Added `__tests__/services/line-identity-service.test.ts`:
  - Existing LINE user reuse.
  - First-time LINE user creation.
  - Email-match account linking.
  - Conflict (`409`) path.
  - Invalid token (`401`) verification path.

## Next Actions
- Run manual smoke after deployment candidate startup:
  - LIFF login -> `/profile`, `/package`, `/history`, `/submitted`.
  - Logout -> protected route redirect determinism.
- Start Phase 4 only after smoke confirms no regression on LIFF/browser session continuity.
