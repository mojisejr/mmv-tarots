# Snapshot: Complete Theme Refactor Plan - "Morning Mystic"

**Date**: 2026-01-04 14:41 GMT+7
**Project**: mmv-tarots
**Theme Name**: Morning Mystic (แม่หมอยามเช้า)
**Core Philosophy**: Friendly Moody (Warm, Accessible, and Deep)

## 1. Color Tokens (Design System)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#FFF0F0` | App background (Softest Rose) |
| `--color-foreground` | `#592E2E` | Primary text (Deep Marsala) |
| `--color-primary` | `#FFD6D1` | Brand color (Misty Rose) |
| `--color-primary-fg` | `#592E2E` | Text on primary buttons |
| `--color-surface` | `rgba(255, 255, 255, 0.7)` | Card/Modal background (White Glass) |
| `--color-accent` | `#D4AF37` | Magic/Gold elements |
| `--color-muted` | `#8C6B6B` | Secondary/Muted text |

## 2. Implementation Steps

### Step 1: Global Styles & Config
- **`tailwind.config.ts`**: 
  - Update `colors` object with new tokens.
  - Add `shadow-warm` utility for soft reddish-brown shadows.
- **`app/globals.css`**:
  - Update `:root` variables.
  - Refactor `@layer base` for light mode body styles.
  - Update `@layer utilities` for `.glass-mimi` and `.glass-celestial` to work on light backgrounds.

### Step 2: Component Refactoring
- **`LiquidBackground`**: 
  - Adjust orb opacity (lower for light mode).
  - Change base background from dark to `--color-background`.
- **`GlassButton`**:
  - Update `primary` variant to use `--color-primary-fg` for text.
  - Update `outline` and `ghost` variants for better contrast on light surfaces.
- **`GlassCard`**:
  - Ensure `bg-glass-white` uses the new 70% opacity white.
  - Add `shadow-warm`.
- **`StatusBadge`**:
  - Darken semantic colors (Success/Warning/Error) for readability on light backgrounds.
- **`Navigation` (Navbar & BottomNav)**:
  - Switch from `bg-black/20` to `bg-white/80`.
  - Update icon and text colors to `--color-foreground`.

### Step 3: Accessibility & UX Polish
- **Contrast Check**: Verify all text-on-background pairs meet WCAG AAA (7:1+).
- **Safe Areas**: Ensure iOS safe area utilities still work with the new background.
- **Transitions**: Maintain smooth page transitions and hover effects.

## 3. Definition of Done
- [ ] All hardcoded dark-mode colors removed.
- [ ] Contrast ratio for main text >= 7:1.
- [ ] Build passes without errors.
- [ ] Lint passes without errors.
- [ ] Visual consistency across all pages (Home, History, Profile, Result).

---
**Oracle Note**: This plan shifts the project from a "Dark Mystic" vibe to a "Modern Cafe Mystic" vibe while maintaining the core identity of Mimi.
