# Snapshot: mmv-tarots Theme & Design Analysis

**Date**: 2026-01-04 14:24 GMT+7
**Project**: mmv-tarots
**Focus**: Theme Refactoring Preparation

## Current Theme Architecture
1. **CSS Variables**: Defined in `app/globals.css` under `:root`.
   - `--color-primary`: #F27669
   - `--color-accent`: #FCBD74
   - `--color-background`: #2a2a2e
2. **Tailwind Config**: `tailwind.config.ts` maps these variables to utility classes.
   - `primary`, `accent`, `background`, `foreground`, `success`, etc.
3. **Design Patterns**:
   - **Glassmorphism**: `.glass-mimi`, `.glass-celestial` in `globals.css`.
   - **Liquid Background**: `LiquidBackground` component using floating orbs and noise texture.
   - **Gradients**: `.text-gradient-gold` and aura glows.

## Findings & Observations
- **Centralization**: Good use of CSS variables makes basic color changes easy.
- **Hardcoded Shades**: Tailwind config contains hardcoded hex values for color shades (50-950) which might need updating if the base hue changes significantly.
- **Inconsistency**: `LiquidBackground` uses `var(--primary)` instead of `var(--color-primary)`.
- **Complexity**: Changing the "Design" (beyond colors) will involve updating utility classes in `globals.css` and potentially adjusting component-specific styles.

## Proposed Action Plan
1. Map all hardcoded design elements.
2. Consolidate CSS variables to ensure consistency.
3. Update `tailwind.config.ts` to be more dynamic if possible.
4. Implement new theme based on user requirements.
