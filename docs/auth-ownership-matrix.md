# Auth Ownership Matrix (Phase 1)

Last Updated: 2026-03-11
Plan Reference: `2026-03-11_10-43_mmv-auth-identity-boundary-refactor-plan.md`

## Module Boundaries

- `auth-core`
  - Owner: Better-Auth configuration and session primitives
  - Files: `lib/server/auth.ts`, `app/api/auth/[...all]/route.ts`
  - Responsibility: session policy, providers, cookie contract, and core auth lifecycle hooks

- `line-gateway`
  - Owner: LINE entry orchestration only
  - Files: `app/liff/page.tsx`
  - Responsibility: LIFF init/login and forwarding verified token to server verify endpoint

- `line-identity`
  - Owner: LINE account-to-user resolution and link decisions
  - Files: `lib/server/services/line-identity-service.ts`
  - Responsibility: verify LINE token/profile, resolve or link account, then request session issuance

- `auth-session`
  - Owner: Better-Auth session issuance wrapper for non-standard entry points
  - Files: `lib/server/services/auth-session-service.ts`
  - Responsibility: issue Better-Auth session and signed cookie response for resolved user identity

- `session-shell`
  - Owner: client navigation/session UX contract
  - Files: `lib/client/providers/navigation-provider.tsx`, `lib/client/auth/session-shell-contract.ts`
  - Responsibility: session-aware navigation and gateway path contract

## Route Ownership Contract

- `app/api/auth/[...all]/route.ts`
  - Owns Better-Auth standard endpoint handling (`signin`, `callback`, `session`, `signout`)

- `app/api/auth/liff-verify/route.ts`
  - Owns LIFF verify endpoint orchestration only
  - Must not become a second generic auth router
  - Session issuance is delegated to `auth-session` after `line-identity` resolution

## Naming Decisions (Phase 1)

- Use `line-identity` for account mapping concern (instead of phase tags or temporary naming)
- Use `lineIdentityEmail` as explicit fallback identity label for LINE-backed users in verify flow
- Use `session-shell` naming for client-side auth/navigation contract concerns

## Guardrails

- Navigation provider must not import from route-level modules
- Provider-specific logic should stay in `line-gateway` and `line-identity` owners only
- Cleanup should remove phase labels where domain naming is available
