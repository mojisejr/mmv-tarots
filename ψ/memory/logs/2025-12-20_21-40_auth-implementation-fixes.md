---
project: mmv-tarots
issue: #none
tags: []
date: 2025-12-20
agent: oracle-keeper
---

# Snapshot: Auth Implementation Fixes & Requirements

**Time**: 2025-12-20 21:40
**Context**: Reviewing PR #30 and identifying missing configurations for Better Auth + Line Login in the mmv-tarots project.

## Insight

1. **Login Trigger**: Better Auth v1 (Next.js) does not expose a direct sign-in page at `/api/auth/signin/line`. It expects the use of the Client SDK. The current implementation in `navigation-provider.tsx` using `window.location.href` results in a 404.
2. **Mandatory Secret**: `BETTER_AUTH_SECRET` must be defined in `.env`. Without it, the library throws a `BetterAuthError` and halts execution (as seen in the build logs).
3. **Callback Route**: The default callback route for Line in Better Auth is `/api/auth/callback/line`, which matches the user's requirement for cross-application compatibility.
4. **Refactoring Needed**: `lib/providers/navigation-provider.tsx` must be updated to import `signIn` from `@/lib/auth-client` and call `signIn.social({ provider: 'line' })`.

## Apply When

- Setting up or troubleshooting Better Auth with social providers.
- Fixing 404 errors on auth endpoints in Next.js App Router.
- Ensuring security compliance for auth secrets.

## Tags

`auth` `better-auth` `line-login` `mmv-tarots` `bug-fix`
