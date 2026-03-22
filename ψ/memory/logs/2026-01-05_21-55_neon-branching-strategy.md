# Snapshot: Neon Database Branching Strategy

**Date**: 2026-01-05 21:55
**Project**: mmv-tarots
**Issue**: #none

## Context
The user wants to implement a robust database branching strategy using Neon Database to protect the production environment.

## Current State
- Single Neon branch (`main`) used for everything.
- `DATABASE_URL` in `.env` points to this branch.

## Proposed Strategy
1. **Neon `main` branch**: Reserved for Production only.
2. **Neon `staging` branch**: Used for Local Development and Remote Staging (Vercel Preview).

## Implementation Plan

### Phase 1: Neon Console Setup (Manual)
1. Create a `staging` branch from `main` in Neon.
2. Copy the connection strings for both `main` and `staging`.
   - Pooled URL (for `DATABASE_URL`)
   - Unpooled URL (for `DIRECT_URL`)

### Phase 2: Local Configuration
1. Update `projects/mmv-tarots/.env`:
   - `DATABASE_URL`: Point to Neon `staging` (pooled).
   - `DIRECT_URL`: Point to Neon `staging` (unpooled).

### Phase 3: Prisma Schema Update
1. Modify `projects/mmv-tarots/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

### Phase 4: Vercel Configuration (Manual)
1. **Production Environment**:
   - `DATABASE_URL`: Neon `main` (pooled).
   - `DIRECT_URL`: Neon `main` (unpooled).
2. **Preview Environment**:
   - `DATABASE_URL`: Neon `staging` (pooled).
   - `DIRECT_URL`: Neon `staging` (unpooled).
3. **Development Environment**:
   - `DATABASE_URL`: Neon `staging` (pooled).
   - `DIRECT_URL`: Neon `staging` (unpooled).

## Benefits
- **Safety**: Production data is isolated from development experiments.
- **Consistency**: Staging environment mirrors production schema and data.
- **Efficiency**: Neon's copy-on-write branching makes this instant and cost-effective.

## Next Steps
- Present this plan to the user.
- Wait for confirmation to proceed with `schema.prisma` changes.
- User to perform manual steps in Neon and Vercel.
