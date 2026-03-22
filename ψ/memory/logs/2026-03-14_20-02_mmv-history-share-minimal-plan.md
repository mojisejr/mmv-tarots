# Snapshot: MMV History Detail Share Minimalization + UX Upgrade

**Time**: 2026-03-14 20:02 +0700
**Context**: Detailed /ppp blueprint for reducing share actions to copy-only trio on history/:id

---
type: plan
project: mmv-tarots
task_id: "#MMV-HISTORY-SHARE-MINIMAL-2026-03"
status: active
tags: [plan, blueprint, ux, sharing]
related_files: [projects/mmv-tarots/components/reading/share-actions.tsx, projects/mmv-tarots/lib/client/share-action-order.ts, scripts/search-oracle.ts]
---

## Objective
- Simplify share actions on history/:id to only three practical actions (copy-link, copy-message, copy-code) while improving clarity, conversion intent, and mobile usability.

## Scope
- In Scope:
  - Remove provider share actions (Facebook, X, TikTok) from ShareActions rendering and action-order policy.
  - Redesign the 3 remaining actions for clearer intent, stronger visual hierarchy, and better tap ergonomics.
  - Keep referral payload behavior and copy semantics intact.
  - Preserve fallback behavior when referral code is absent (hide copy-code only).
- Out of Scope:
  - Any auth/session/LIFF logic changes.
  - Changes to /share/[id] page content flow.
  - New feature toggles/options/advanced mode.

## Phases
### Phase 1: Action Surface Simplification
- Deliverables:
  - Remove Facebook/X/TikTok action config + handlers from share-actions.tsx.
  - Reduce ShareActionId union and ordering logic to copy-link | copy-message | copy-code.
- Exit Criteria:
  - history/:id renders only copy-based actions.
  - No dead imports/unused code from removed providers.
- Critical Test Cases:
  - Open history/:id in browser and verify no provider icons/buttons are shown.
  - Validate no runtime errors on mount.

### Phase 2: UX Upgrade for Minimal Trio
- Deliverables:
  - Replace icon-only small chips with high-clarity action cards/buttons (distinct title + helper text).
  - Improve spacing, contrast, and touch target sizes for mobile.
  - Preserve copied-state feedback (Check) and toast confirmation.
- Exit Criteria:
  - Actions are self-explanatory without external instruction.
  - Layout remains stable across narrow and wide screens.
- Critical Test Cases:
  - Mobile viewport: buttons readable and easy to tap.
  - Desktop viewport: balanced spacing and no overflow.

### Phase 3: Behavioral Integrity Validation
- Deliverables:
  - Verify payload composition still includes canonical link and optional referral code.
  - Confirm code-copy action appears only when referral code exists.
- Exit Criteria:
  - Copy outputs are correct and consistent with previous referral strategy.
- Critical Test Cases:
  - Logged-in user with code: copy-code visible and clipboard receives code.
  - User without code: copy-code hidden; other 2 actions still work.

### Phase 4: Hard Gate + Snapshot Hygiene
- Deliverables:
  - Execute npm run build, npm run lint and targeted tests if available.
  - Record completion summary and ensure no temporary plan artifacts remain.
- Exit Criteria:
  - Build/Lint pass.
  - Working tree only contains intentional implementation files.
- Critical Test Cases:
  - Build completes without TS errors.
  - Lint completes without new warnings/errors in touched files.

## Risks & Countermeasures
- Risk: Losing discoverability after removing familiar social icons.
  - Countermeasure: strengthen CTA copy and helper text under each remaining action.
- Risk: Regression in referral-share payload content.
  - Countermeasure: keep payload generator unchanged; validate clipboard outputs manually.
- Risk: Overly heavy visual treatment harming existing design language.
  - Countermeasure: reuse existing token palette and glass-card vocabulary.

## Rollback Strategy
- Trigger:
  - If copy actions fail or conversion/engagement drops materially in smoke verification.
- Reversal Steps:
  1. Revert share-actions.tsx and share-action-order.ts to last known good commit.
  2. Re-run build/lint.
  3. Restore previous UI while preparing a lighter UX iteration.

## Verification Strategy (Hard Gate)
- Build: cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build
- Lint: cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint
- Test: run focused test command if share-related tests exist; otherwise perform manual smoke on history/:id with and without referral code.
- Evidence:
  - Successful command exit codes.
  - Visual/manual verification notes for two user states (has code / no code).

## Tags
mmv-tarots history share ux minimal-surface

