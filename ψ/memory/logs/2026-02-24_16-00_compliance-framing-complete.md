# Snapshot: Compliance Framing Implementation Results (Phase 2)

**Time**: 2026-02-24 16:00
**Context**: Finalizing Phase 2 of the Omise (Opn) payment integration plan for `mmv-tarots`.

## Insight

The compliance framing phase is successfully completed. We have systematically reframed the application's identity to mitigate risk during the merchant audit process.

**Key Changes Applied**:
1. **Terminology Pivot**: All instances of "Tarot" or "Fortune Telling" in the onboarding flow and core constants have been replaced with "Personalized Guidance", "Wellness Insight", and "Mimi Guide".
2. **UI Simplification**: Removed the site-wide footer to reduce noise and potential compliance friction points.
3. **UX Hardening**: Added `target="_blank"` to internal policy links (Privacy, Terms) within the onboarding modal. This prevents the "Context Loss" issue where users would navigate away from the active ritual in the same tab.
4. **Welcome Ritual Refactoring**: Updated success messaging and labels to align with the new guidance-focused brand identity.

**Verification Results**:
- `npm run build`: 100% Success (26/26 pages generated).
- `npm run lint`: 100% Pass (No errors).
- Git Status: Committed locally on `feature/phase2-framing-compliance`.

## Apply When

- Preparing for payment gateway audits (Omise, Stripe, etc.) where business category risk is a factor.
- Performing a brand pivot or terminology overhaul in a Next.js App Router project.
- Fixing navigation-induced state loss in modal-based user flows.

## Tags

`omise-compliance` `framing-pivot` `wellness-guidance` `mmv-tarots` `nextjs-app-router`
