# Fix: Tailwind v4 Configuration Migration

**Timestamp**: 2026-01-04 14:57 +07
**Issue**: Build failed with `unknown utility class shadow-warm`.
**Root Cause**: Tailwind v4 configuration in `tailwind.config.ts` was not being picked up correctly or conflicted with the CSS-first approach.
**Resolution**:
1.  **Deleted** `tailwind.config.ts`.
2.  **Migrated** all theme configuration (colors, shadows, animations) to `app/globals.css` using the `@theme` directive.
3.  **Verified** build success (`npm run build` passed in 4.0s).

## Key Changes
- Moved custom shadows (`--shadow-warm`, etc.) to CSS variables inside `@theme`.
- Moved custom colors (`--color-primary`, etc.) to CSS variables inside `@theme`.
- Removed legacy JS configuration.

## Outcome
The "Morning Mystic" theme is now fully active and the build is stable.
