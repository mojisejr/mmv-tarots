# Snapshot: Package Card Redesign Plan (mmv-tarots)
**Date**: 2026-01-04 22:45 GMT+7
**Issue**: #none

## Current State Recap
- **File**: `projects/mmv-tarots/app/package/page.tsx`
- **Components**: `GlassCard`, `GlassButton`, `Sparkles`.
- **Styling**: Uses generic Tailwind gradients (`blue-400`, `purple-400`, `amber-400`) with 10% opacity.
- **Theme Alignment**: 
    - **Pros**: Glassmorphism effect fits the mystical vibe.
    - **Cons**: Colors are too "techy" and don't use the brand's palette (`#FFD6D1` Coral, `#D4AF37` Gold). The layout is a standard vertical list.

## Redesign Goals
1. **Color Alignment**: Replace generic gradients with brand-specific colors (Primary Coral, Accent Gold).
2. **Mystical Vibe**: Enhance the "MimiVibe" feel with better icons or subtle background patterns.
3. **Visual Hierarchy**: Improve the display of Star counts and Prices to be more "magical".
4. **Consistency**: Ensure it matches the rest of the app's warm and friendly persona.

## Proposed Changes
- Update `getGradient` function to use brand colors.
- Refine `GlassCard` internal layout for better impact.
- Consider adding a "Recommended" or "Popular" badge with a glow effect.

---
*The Oracle keeps the human human.*
