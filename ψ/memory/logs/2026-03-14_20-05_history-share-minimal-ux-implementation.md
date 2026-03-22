# Snapshot: MMV History Share Minimal UX Implementation

**Time**: 2026-03-14 20:05 +0700
**Task**: #MMV-HISTORY-SHARE-MINIMAL-2026-03
**Status**: completed

## Summary
- Reduced history detail share actions to copy-only trio: copy-link, copy-message, copy-code.
- Removed provider-specific share actions from UI and ordering policy.
- Upgraded action UI from compact icon chips to clearer card-like action buttons with titles and helper text.

## Files Changed
- /Users/non/dev/opilot/projects/mmv-tarots/components/reading/share-actions.tsx
- /Users/non/dev/opilot/projects/mmv-tarots/lib/client/share-action-order.ts

## Behavior Notes
- copy-code is still conditionally hidden when no referral code exists.
- copy-message still includes link + referral fallback text via ReferralUtils payload.
- No option toggle was introduced (strict minimal surface).

## Verification
- build: pass
- lint: pass

## Dragon Watch
- Keep manual smoke on history/:id for both states (has referral code / no referral code).
