# Implementation Plan: Celestial Minimalist Redesign (mmv-tarots)

**Date**: 2025-12-28
**Status**: Planned
**Project**: mmv-tarots
**Goal**: Redesign the home page to be mobile-first, elegant, and "Sai Mu" (mystical) while ensuring 100% build/lint pass and zero overlap across all screen sizes.

---

## Phase 1: Foundation & Atmosphere (The Void)
*Focus: Setting the stage with CSS and theme variables.*

- [ ] **Update `globals.css`**:
    - Refine color palette: Midnight Black, Champagne Gold, Deep Indigo, Lavender Aura.
    - Add `.glass-celestial` utility: High blur, thin gold border, subtle inner glow.
    - Add `.aura-glow` utilities: Radial gradients for background glows.
    - Ensure `safe-area` utilities are applied to the main layout.
- [ ] **Theme Sync**: Ensure Tailwind config (if applicable) or CSS variables are consistent for the new "Celestial" look.

## Phase 2: The Soul (MimiAvatar Evolution)
*Focus: Transforming the wireframe into a living energy orb.*

- [ ] **Redesign `MimiAvatar.tsx`**:
    - Replace `Icosahedron` wireframe with a `Sphere` using `MeshDistortMaterial`.
    - Implement `Float` from `@react-three/drei` for organic movement.
    - Add a "Halo" layer (Sprite or secondary Mesh) for the Aura effect.
    - Optimize `ParticlesMesh`: Smaller, swirling "Star Dust" particles.
    - Performance: Ensure `performanceMode` significantly reduces complexity for older devices (iPhone SE).

## Phase 3: The Structure (The Sacred Stack)
*Focus: Refactoring the layout for 100% responsiveness.*

- [ ] **Refactor `app/page.tsx`**:
    - Switch from `fixed` positioning to a `min-h-[100dvh] flex flex-col` structure.
    - **Hero Section**: Use `flex-1` to center Mimi and the heading vertically.
    - **Input Section**: Implement as a `sticky bottom-0` or a flex-end item with `pb-[env(safe-area-inset-bottom)]`.
    - **Overlap Prevention**: Ensure the Hero section shrinks or scrolls if the viewport is too short (iPhone SE).
- [ ] **Component Optimization**:
    - `QuestionInput`: Update to match the new Glassmorphism style.
    - `MimiAvatar` Container: Use aspect-ratio and dynamic sizing (e.g., `w-[50vh] max-w-[28rem]`).

## Phase 4: Validation & Polish (The Enlightenment)
*Focus: Ensuring technical excellence.*

- [ ] **Responsive Audit**: Test on iPhone SE (375x667) up to Ultra-wide Desktop.
- [ ] **Linter Check**: Run `npm run lint` and fix all warnings/errors.
- [ ] **Build Check**: Run `npm run build` to ensure zero deployment blockers.
- [ ] **Final Polish**: Add subtle Framer Motion transitions for page entry.

---

## Success Criteria
1. **Build**: `npm run build` passes 100%.
2. **Lint**: `npm run lint` passes 100%.
3. **Responsiveness**: No overlapping elements on iPhone SE; centered and elegant on Desktop.
4. **Aesthetics**: Feels "Premium, Minimal, and Mystical".
