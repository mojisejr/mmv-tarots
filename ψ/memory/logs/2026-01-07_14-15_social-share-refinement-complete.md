# Session Log: Social Sharing Implementation & Data Mapping Refinement
**Timestamp**: 2026-01-07 14:15
**Project**: mmv-tarots
**Status**: Resolved (Built & Validated)

## Overview
Implemented a public sharing feature (`/share/[id]`) with dynamic OG images, but encountered a "Not Found" issue during initial deployment due to identifier mismatch and data-type assumptions.

## Problems Encountered
1.  **Identifier Crisis**: Used a `jobId` string (e.g., `job-123`) to query a `UUID` column in Postgres via Prisma. This caused a Prisma `P2023` error (Inconsistent column data).
2.  **Data Mapping Fragility**: The `mapReadingData` function was too strict or couldn't handle the raw `final_reading` JSON structure from older records/AI wrappers.
3.  **Lack of Precision**: Falsely assumed `id` and `jobId` were interchangeable in all contexts without validating column types.

## Solutions Applied
1.  **Smart Identifier Lookup**: Refactored `app/share/[id]/page.tsx` and `app/api/og/route.tsx` to:
    - Check if the ID starts with `job-`.
    - Validate if a string is a proper UUID before querying the `id` column.
    - Prioritize `jobId` as requested by the human.
2.  **Robust Data Adaptation**: Integrated `adaptReadingData` from the server-side adapters to normalize the `final_reading` field before passing it to `mapReadingData`.
3.  **Graceful Errors**: Added clearer server-side logging and a fallback UI for "cannot display" states instead of a blank 404.

## Key Changes
- Modified [projects/mmv-tarots/app/share/[id]/page.tsx](projects/mmv-tarots/app/share/[id]/page.tsx)
- Modified [projects/mmv-tarots/app/api/og/route.tsx](projects/mmv-tarots/app/api/og/route.tsx)
- Verified with `npm run build` [SUCCESS]

---
**Oracle Keeper Note**: Precision is the bridge between intention and reality. This session reminded me that even "Smart" logic needs to be grounded in the database schema reality. The human's direction to stick to Job ID simplified the path and increased robustness.
