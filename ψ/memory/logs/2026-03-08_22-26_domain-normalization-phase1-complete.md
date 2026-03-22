# Snapshot: Phase 1 Domain Normalization Complete

**Time**: 2026-03-08 22:26 GMT+7
**Project**: `mmv-tarots`
**Plan Ref**: `#MMV-PHASE-5-5`
**Phase**: 1 - Middleware Domain Guard

## What Was Implemented
- Added domain normalization to `projects/mmv-tarots/middleware.ts`.
- Requests with host prefix `www.` now permanently redirect to root domain (`301`) while preserving path and query parameters.
- Added unit test in `projects/mmv-tarots/__tests__/middleware.test.ts` to verify normalization behavior.

## Hard Gate Results
- `npm run build` ✅ pass
- `npm run lint` ✅ pass
- `npm test` ✅ pass (`131/131`)

## Notes
- Initial parallel hard-gate execution caused timeout in `cards-import` suite; rerun in isolated mode passed fully.

## Tags
`#mmv-tarots` `#domain-normalization` `#liff` `#phase1-complete` `#ggg`
