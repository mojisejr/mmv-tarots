# Snapshot: MMV Redirect Loop Recovery Completed
**Time**: 2026-03-08 23:16 (+07)
**Context**: `projects/mmv-tarots` | Issue `#MMV-PHASE-5-6` | Branch `staging`

## Tags
- #mmv-tarots
- #redirect-loop
- #liff-gateway
- #hard-gate-pass
- #vercel-domain-normalization

## Evidence
- Commit created: `6b8a9c8` (`fix(#MMV-PHASE-5-6): remove app-level www redirect and harden liff auth flow`)
- App middleware no longer performs host-level `www -> root` redirect (delegated to Vercel Domain Settings).
- Added explicit `/liff` exemption path from auth redirect flow to avoid loop risk.
- Hard Gate passed:
  - `npm run build`: pass
  - `npm run lint`: pass
  - `npm test`: pass (`134/134`)

## Apply When
- Vercel already handles canonical domain redirect at infrastructure layer.
- App-level middleware host redirects cause double-hop, race, or infinite loop with platform redirects.

## Next Actions
- Deploy current `staging` commit and validate in Incognito:
  - `https://maemormimi.com/liff`
  - `https://www.maemormimi.com/liff` (must land on root once and continue flow)
- If stable, run `rrr` to close this incident thread.
