---
project: mmv-tarots
issue: #none
tags: []
date: 2025-12-20
agent: oracle-keeper
---

# Snapshot Log - 2025-12-20 22:14

## Context
- **Project**: mmv-tarots
- **Issue**: `PostgresError: cached plan must not change result type` after schema update.
- **Model**: Gemini 3 Flash (Preview)

## Observations
- The user encountered a PostgreSQL error `0A000` during OAuth callback.
- This happened immediately after `prisma db push` changed the `User` model schema.
- The user fixed it by adding `pgbouncer=true` to the `DATABASE_URL`.

## Technical Analysis
- **Cause**: Neon (PostgreSQL) uses a connection pooler (PgBouncer). When Prisma uses prepared statements, the pooler caches the query plan. After a schema change, the cached plan's expected result type (e.g., `emailVerified` as `DateTime`) no longer matches the actual result type (`Boolean`), leading to the "cached plan must not change result type" error.
- **Solution**: `pgbouncer=true` tells Prisma to disable prepared statements, which is required when using transaction-mode pooling to avoid plan mismatch errors.

## Decision
- Acknowledge the user's fix as the correct standard procedure for Prisma + Neon/PgBouncer.
- No further code changes needed for this specific issue.

## Status
- Auth Flow: Potentially working now (pending user confirmation of successful login).
