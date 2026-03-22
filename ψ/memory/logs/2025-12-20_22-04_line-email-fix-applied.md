---
project: mmv-tarots
issue: #none
tags: []
date: 2025-12-20
agent: oracle-keeper
---

# Snapshot: Line Login Email Fix Applied

**Time**: 2025-12-20 22:04
**Context**: Applying a quick fix to `lib/auth.ts` to handle cases where Line does not return a user's email address, preventing authentication failures.

## Insight

1.  **Graceful Email Handling**: Implemented `mapProfileToUser` for the Line provider. It now generates a placeholder email (`sub@line.placeholder`) if the real email is missing. This satisfies Better Auth's requirement for an email field while allowing users without shared emails to log in.
2.  **Data Preservation**: The mapping ensures that the user's name and profile picture from Line are still correctly captured and stored in the database.
3.  **Issue Alignment**: This fix directly addresses the "Provider did not return email" error identified in historical Issue #48.

## Apply When

- Social login providers (like Line or GitHub) do not consistently return user email addresses.
- Better Auth throws "Provider did not return email" during the OAuth callback.

## Tags

`auth-fix` `better-auth` `line-login` `email-placeholder` `mmv-tarots`
