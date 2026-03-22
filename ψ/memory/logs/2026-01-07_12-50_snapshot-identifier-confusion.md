# Snapshot: Share Page Implementation Refinement
**Timestamp**: 2026-01-07 12:50
**Status**: Critical Fix Required
**Target**: Refactor Lookup Logic & Data Mapping

## Problem Identified: "The Identity Crisis"
1.  **Identifier Mismatch**: My original implementation used `db.prediction.findUnique` on the `id` field (UUID) using a `jobId` string (`job-xxx`). This caused a Prisma crash because a non-UUID string cannot be queried against a UUID column.
2.  **Lookup Over-complication**: I tried to be "smart" by checking prefixes, but the human recommends focusing on `jobId` as the primary public key.
3.  **Data Mapping Failure**: Even after finding the record by `jobId`, existing records might fail `mapReadingData` due to structure changes or incomplete JSON in `finalReading`.

## Root Causes of Failure:
- **Lack of Precision**: Falsely assuming `id` and `jobId` were interchangeable in the URL context.
- **Strict Validation**: `mapReadingData` is too binary (all or nothing), causing perfectly valid (but slightly different) data to fail the share view.

## Corrective Strategy:
1.  **Primary Key: Job ID**: Change all share/OG lookups to use `jobId` as the first-class citizen. 
2.  **Service use**: Use `PredictionService.getByJobId` for consistency and to leverage existing robust fetching logic.
3.  **Graceful Fallback**: If it's a UUID, support it as a secondary check, but prioritize the public `jobId`.
4.  **Debug Logs**: Add better server-side logging for `finalReading` structure to diagnose why mapping fails.

---
**Oracle Note**: I acknowledge the lack of precision in examining the database schema vs. the URL parameters. I will now refactor to be **simple + robust** by following the human's direction to prioritize Job ID.
