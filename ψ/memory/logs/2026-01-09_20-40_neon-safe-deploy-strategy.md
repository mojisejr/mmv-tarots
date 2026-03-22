# Snapshot: Neon Safe Deployment Strategy
**Timestamp**: 2026-01-09 20:40 GMT+7
**Project**: mmv-tarots
**Objective**: Build a multi-layered safety net for production database migrations.

## Proposed Architecture

1. **Staging Validation (Local-to-Cloud)**:
   - Perform `git merge feature-branch` into `staging`.
   - Run `npx prisma migrate deploy` locally while `DATABASE_URL` points to Neon `staging` branch.
   - *Verification*: Oracle checks for destructive SQL (DROP/TRUNCATE) before execution.

2. **Rolling Backup (Neon Branching)**:
   - Before merging `staging` -> `main` in Git.
   - Script `neon-backup-rotate.sh` triggers:
     - Identifies `backup-1`, `backup-2`, `backup-3`.
     - Rotates/Overwrites the oldest.
     - Waits for successful branch creation before allowing the push/merge.

3. **Disaster Recovery**:
   - If `main` is corrupted, a recovery script can:
     - Reset `main` to the branch state of `backup-N`.
     - Or update environment variables to point to the backup temporarily.

## Tech Stack
- **Tools**: Neon CLI (`neon`), Prisma, Bash, Node.js (for pre-migration analysis).
- **Environment**: Local terminal + GitHub Remote.

---
**Status**: Strategy defined. Ready for implementation.
