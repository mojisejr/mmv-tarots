---
type: snapshot
project: mmv-tarots
task_id: "#universal-referral"
status: active
tags: [snapshot, referral, phase-g, liff, ux]
related_files: [projects/mmv-tarots/components/reading/share-actions.tsx, projects/mmv-tarots/lib/client/liff-environment.ts, projects/mmv-tarots/lib/client/share-action-order.ts]
---

# Snapshot: Phase G LIFF-Aware UX Branch

**Time**: 2026-03-12 23:46 +0700  
**Context**: Execute `ggg` Phase G by making referral share UX LIFF-aware, prioritizing fallback actions (`Copy Code`, `Copy Message`) in LINE in-app environments while preserving non-LIFF link-first behavior.

## Tags
- `phase-g`
- `liff-aware`
- `cta-priority`
- `referral-fallback`

## Evidence
- Added `isLiffEnvironment(...)` utility for lightweight client-side LIFF/WebView detection.
- Added `resolveShareActionOrder(...)` to centralize CTA ordering policy by environment.
- `share-actions` now supports explicit `Copy Code` action and environment-driven action order:
  - LIFF: code-first (`copy-code -> copy-message -> copy-link -> social`)
  - Non-LIFF: link-first (`copy-link -> copy-message -> social -> copy-code`)
- `profile` referral card now visually emphasizes `Copy Referral Code` in LIFF mode.
- Added tests:
  - `__tests__/lib/liff-environment.test.ts`
  - `__tests__/components/reading/share-actions-priority.test.ts`
- Hard gate passed:
  - `npm run build`
  - `npm run lint`
  - `npm test` (`28 files`, `159 tests`)
- Commit: `6ea9598` (`feat(#universal-referral): implement phase G liff-aware share priority`).

## Apply When
- Use this branch when social-intent redirects inside WebView can drop context and users need deterministic fallback sharing behavior that works in chat-first flows.

## Next Actions
- Run a quick manual smoke on LINE in-app browser to confirm CTA ordering and copy payload usability end-to-end in real device context.
