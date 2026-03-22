# Snapshot: MMV LIFF Loading Theme Token Unification Blueprint

**Time**: 2026-03-14 07:44 +0700
**Context**: Detailed plan for unifying LIFF loading screen with system theme conventions and semantic design tokens

---
type: plan
project: mmv-tarots
task_id: "#MMV-LIFF-THEME-TOKEN-2026-03"
status: active
tags: [plan, blueprint, liff, loading, theme, design-token, a11y]
related_files:
  - /Users/non/dev/opilot/projects/mmv-tarots/app/liff/page.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/app/globals.css
  - /Users/non/dev/opilot/projects/mmv-tarots/components/layout/global-loading.tsx
  - /Users/non/dev/opilot/projects/mmv-tarots/tailwind.config.ts
---

## Objective
- Make `mmv-tarots` LIFF loading screen stop using hardcoded dark/white styles and align with shared semantic theme tokens for stronger UI consistency and accessibility.

## Scope
- In Scope:
  - Refactor `LiffGatewayLoading` in `app/liff/page.tsx` from `from-black ... text-white` to token-based semantic classes.
  - Confirm and reuse loading-related semantic tokens in `app/globals.css` (`surface`, `border`, `text`).
  - Define a reusable loading style convention for background, card surface, border, spinner, heading, and helper text.
  - Add regression checks (targeted grep + hard-gate + manual smoke).
- Out of Scope:
  - Auth/session/LIFF verify logic changes.
  - Full project color redesign in one pass.
  - Social/share color refactor outside loading/auth entry surfaces.

## Grounding Notes
- `project_map.md` confirms architecture direction: Better-Auth single-core + LIFF as gateway, with manual smoke risk on each candidate deploy.
- Current code evidence:
  - `app/liff/page.tsx` still has `bg-gradient-to-b from-black to-neutral-900 text-white`.
  - `components/layout/global-loading.tsx` already uses semantic loading style (`bg-background/80`).
  - `app/globals.css` already defines semantic tokens: `--color-surface-card`, `--color-border-subtle`, `--color-text-muted`.
- Evidence gap:
  - Search Insight command (`bun scripts/search-oracle.ts "mmv-tarots decision OR blocker OR consensus OR vow"`) returned no matching records, so this plan uses map + source code + latest retrospective as canonical evidence.

## Phases

### Phase 1: Loading Token Contract Definition
- Deliverables:
  - Define explicit token contract for loading UIs: background, card, border, spinner accent, heading text, helper text.
  - Map approved semantic classes for each contract item.
- Exit Criteria:
  - Team has one clear token/class contract for loading surfaces without `black/white` hardcoding.
  - No ambiguity in implementation for LIFF loading visual language.
- Critical Test Cases:
  - Contract covers both fullscreen loading and card-contained loading states.
  - All selected classes resolve against existing tokens in `globals.css`.

### Phase 2: LIFF Loading Refactor
- Deliverables:
  - Update `app/liff/page.tsx` loading UI to semantic classes.
  - Remove hardcoded dark gradient and white text dependencies in `LiffGatewayLoading`.
- Exit Criteria:
  - No `from-black`, `to-neutral-900`, `text-white`, `border-white/10` in `LiffGatewayLoading`.
  - Visual tone aligns with existing system style (`GlobalLoading`).
- Critical Test Cases:
  - `/liff` loading renders correctly in mobile and desktop viewport sizes.
  - Spinner and text remain readable and visually balanced with new token palette.

### Phase 3: Shared Pattern Hardening
- Deliverables:
  - Add/adjust utility pattern only if needed to prevent class duplication drift for loading cards.
  - Keep implementation aligned with existing semantic utilities (`glass-mimi`, semantic border/text usage).
- Exit Criteria:
  - Reusable loading pattern available without long copy-pasted class chains.
  - No unnecessary token expansion.
- Critical Test Cases:
  - New utility (if created) does not clash with existing utilities.
  - CSS/Tailwind compile remains valid.

### Phase 4: Localized Black-Class Sweep (Loading/Auth Surfaces)
- Deliverables:
  - Sweep only loading/auth-entry-adjacent surfaces for hardcoded black usage.
  - Produce follow-up backlog list for non-scope black usages (e.g., navbar/profile/share areas).
- Exit Criteria:
  - No hardcoded black classes remain in the defined loading/auth scope.
  - Follow-up list is explicit and ready for next phase.
- Critical Test Cases:
  - Targeted grep confirms banned patterns removed from scoped files.
  - No unintended UI regression in LIFF entry/loading context.

### Phase 5: Verification, Rollback, and Handoff
- Deliverables:
  - Run hard gate (`build`, `lint`, `test`).
  - Capture before/after verification notes (diff + manual smoke summary).
  - Prepare file-level rollback recipe.
- Exit Criteria:
  - `npm run build`, `npm run lint`, and `npm run test` pass in `mmv-tarots`.
  - Manual smoke on `/liff` and global loading context passes.
- Critical Test Cases:
  - `/liff` with normal and malformed state still shows loading correctly and proceeds flow.
  - Redirect/session behavior remains unchanged (visual-only change).

## Risks and Countermeasures
- Risk: Reduced contrast on specific devices after color swap.
  - Countermeasure: enforce semantic text contrast (`text-foreground`, `text-muted-foreground`) and manual visual check.
- Risk: Scope creep into auth behavior.
  - Countermeasure: restrict edits to presentational classes only in loading components.
- Risk: Token drift due to over-adding utilities/tokens.
  - Countermeasure: prefer existing tokens first; add only when duplication is proven.
- Risk: False confidence from grep-only validation.
  - Countermeasure: combine grep checks + hard gate + manual smoke.

## Rollback Strategy
- Trigger:
  - Any visual blocker in `/liff` loading (unreadable text, broken layout, perceived regression in entry flow).
- Rollback Steps:
  - Revert only touched presentational files (`app/liff/page.tsx`, and `app/globals.css` if modified).
  - Re-run hard gate and manual smoke.
- Guardrail:
  - Do not revert or alter LIFF verify/session logic while rolling back visual changes.

## Verification Strategy (Hard Gate)
- Commands:
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run build`
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run lint`
  - `cd /Users/non/dev/opilot/projects/mmv-tarots && npm run test`
- Targeted Checks:
  - `rg -n "from-black|to-neutral-900|text-white|border-white/10" /Users/non/dev/opilot/projects/mmv-tarots/app/liff/page.tsx`
  - `rg -n "LiffGatewayLoading" /Users/non/dev/opilot/projects/mmv-tarots/app/liff/page.tsx`
- Manual Smoke:
  - Open `/liff` on normal desktop browser and mobile viewport simulation.
  - Verify heading/helper readability and spinner clarity on target background.

## Decisions and Constraints
- Follow semantic-token-first principle established in previous theme/a11y work.
- This artifact is planning-only and intentionally excludes implementation steps.
- Execution handoff target: `ggg` or implementer workflow after human approval.

## Execution Update (ggg)
- Executed at: 2026-03-14 07:44-07:50 +0700
- Phase 1: `DONE`
  - Applied semantic loading token contract to LIFF loading surface.
- Phase 2: `DONE`
  - Refactored `LiffGatewayLoading` in `app/liff/page.tsx` from hardcoded dark palette to semantic theme tokens.
- Phase 3: `DONE`
  - Reused existing semantic utilities/tokens without adding new utility classes because duplication threshold was not met.
- Phase 4: `DONE`
  - Localized sweep completed for loading/auth scope files.
  - Follow-up backlog (non-scope black usage):
    - `app/submitted/page.tsx`
    - `components/layout/profile-dropdown.tsx`
    - `components/layout/navbar.tsx`
    - `components/reading/share-actions.tsx`
    - `components/ui/question-input.tsx`
- Phase 5: `DONE`
  - Hard Gate passed:
    - Build: passed
    - Lint: passed
    - Test: `159/159` passed (`28` test files)

