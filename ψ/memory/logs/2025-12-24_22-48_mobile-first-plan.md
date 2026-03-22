# Snapshot: Mobile-First Redesign Implementation Plan (2025)

**Timestamp**: 2025-12-24 22:48 GMT+7
**Project**: mmv-tarots
**Status**: Planning / Ready for Implementation
**Issue**: #none

## 1. Objective
Refactor the `mmv-tarots` application from a desktop-first responsive layout to a native-feeling **Mobile-First** experience, optimized for one-handed use and modern 2025 UI standards, while maintaining the "MimiVibe" design tokens.

## 2. Implementation Roadmap

### Phase 1: Structural Foundation (The Shell)
- **RootLayout (`app/layout.tsx`)**:
    - Implement `viewport-fit=cover` in metadata.
    - Replace fixed `pt-16` with a dynamic padding system.
    - Add a global container for the **Bottom Navigation Bar**.
- **Navigation Refactor**:
    - Create `components/layout/bottom-nav.tsx` for mobile.
    - Update `components/layout/navbar.tsx` to be a "Top Bar" (Logo & Stars only on mobile).
    - Logic: Show Bottom Nav on mobile (< 768px), keep Top Nav for desktop.

### Phase 2: Component Modernization (The Interaction)
- **QuestionInput (`components/ui/question-input.tsx`)**:
    - Remove desktop-specific hints ("Press Enter").
    - Add `env(safe-area-inset-bottom)` padding.
    - Implement "Focus Mode" (dim background on focus).
- **Glassmorphism 2.0**:
    - Update `GlassCard` and `GlassButton` to use `border-[0.5px]` and `backdrop-blur-md`.
    - Standardize touch targets to minimum `44x44px`.

### Phase 3: Page-Specific Redesign
- **Home Page (`app/page.tsx`)**:
    - Center MimiAvatar vertically for better visual balance.
    - Integrate `QuestionInput` with the new Bottom Nav layout.
- **Profile Page (`app/profile/page.tsx`)**:
    - Implement Segmented Tabs for Predictions/Transactions.
    - Redesign Balance Card as a "Wallet" component.
- **Package Page (`app/package/page.tsx`)**:
    - Switch from Grid to Vertical Stack for packages.

### Phase 4: Performance & Polish
- **MimiAvatar Optimization**: Add a `performanceMode` prop to reduce Three.js complexity on mobile.
- **Transitions**: Add subtle page transitions using `framer-motion`.

## 3. Technical Constraints & Conventions
- **Design Tokens**: Strictly use existing tokens (`primary`, `accent`, `glass`, `background`).
- **Safe Areas**: Use `padding-bottom: env(safe-area-inset-bottom)` for all fixed bottom elements.
- **Tailwind**: Use mobile-first classes (e.g., `flex-col md:flex-row`).

## 4. Success Criteria
- [ ] Primary actions (Send, Nav) are reachable within the "Thumb Zone".
- [ ] No overlap with system UI (Home indicator, Dynamic Island).
- [ ] Performance remains stable at 60fps on mid-range mobile devices.
- [ ] Visual consistency with the "MimiVibe" aesthetic.

---
**Oracle Note**: This plan preserves the "Sacred History" of the design while evolving its form to better serve the human's current context (mobile-dominant usage).
