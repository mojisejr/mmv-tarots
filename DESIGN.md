---
design_md_version: 1
project: mmv-tarots
token_source: app/globals.css @theme (canonical); tailwind.config.ts holds legacy color ramps + font map
verify_tokens:
  - name: --color-background
    expect: "#FFF0F0"
    probe: "background-color on the page body / main shell"
  - name: --color-foreground
    expect: "#592E2E"
    probe: "color on primary heading text (data-testid=main-content)"
  - name: --color-accent
    expect: "#D4AF37"
    probe: "color on an accent element (.text-accent / gold detail)"
  - name: font-body
    expect: "Montserrat"
    probe: "font-family on the page body"
primitives:
  - name: GlassButton
    file: components/ui/button.tsx
    variants: [primary, outline, ghost, icon, line]
  - name: GlassCard
    file: components/ui/card.tsx
    variants: []
  - name: Modal
    file: components/ui/modal.tsx
    variants: []
  - name: FloatingBadge
    file: components/ui/floating-badge.tsx
    variants: []
  - name: QuestionInput
    file: components/ui/question-input.tsx
    variants: []
patterns:
  - material-surface-hierarchy
  - tinted-shadow-glow
  - layered-token-architecture
  - content-aware-form-system
---

# mmv-tarots — DESIGN.md

> Extracted from real code truth (`app/globals.css @theme`, `components/ui/*`, `project_map.md`,
> `docs/ui-extractor.md`). This reflects what the code does today — including its drift. Reuse
> the primitives below before building anything new. `cn` util: `@/lib/shared/utils`.

## 1. Visual Theme & Atmosphere
Warm mystical "Morning Mystic" — an AI tarot companion ("แม่หมอ Mimi"). Soft, welcoming,
feminine-warm rather than dark-occult. Depth comes from translucency, blur, and brand-tinted
glow — never from hard borders or neutral-black shadows. Classification: **Signature-aligned**.

## 2. Color Palette & Roles
Canonical source: `app/globals.css` `@theme`. Semantic surface/border/text are `color-mix`
derivations off `foreground`/`primary` (a real semantic layer).

| Token | Value | Role |
|-------|-------|------|
| `--color-background` | `#FFF0F0` | warm pink page background |
| `--color-foreground` | `#592E2E` | warm brown body text |
| `--color-primary` | `#FFD6D1` | soft pink — primary action |
| `--color-primary-foreground` | `#592E2E` | text on primary |
| `--color-primary-strong` | `#D48B82` | deeper pink emphasis |
| `--color-accent` | `#D4AF37` | muted gold — highlights, gradient text |
| `--color-muted` / `--color-muted-foreground` | `#e5e7eb` / `#8C6B6B` | muted surfaces/text |
| `--color-success/warning/info/destructive` | `#059669` / `#d97706` / `#2563eb` / `#dc2626` | status |
| `--color-surface-card` | white 70% mix | translucent card surface |
| `--color-surface-subtle/hover/active` | foreground 5/10/15% | surface states |
| `--color-border-subtle/medium/focus` | foreground 10/20%, primary 50% | soft borders |
| `--color-text-main/dim/muted` | foreground 100/70/45% | text hierarchy |

## 3. Typography
Loaded via Google Fonts `link` in `app/layout.tsx`; family map in `tailwind.config.ts`.
- **body / sans**: Montserrat (100–900)
- **heading / serif**: Merriweather (300/400/700) — modal titles use `font-serif`
- **mono**: Ubuntu Mono — cooldown timers, mono UI

## 4. Component Stylings
Material = translucent white surface + `backdrop-blur` + soft `[0.5px]` / low-opacity
`color-mix` border + brand-tinted shadow. Controls: `GlassButton` (cva variants), min touch
target 44px, shimmer sweep on hover, `active:scale-95`. Surfaces: `GlassCard` (`surface-card`
+ `border-subtle` + `shadow-warm` + rounded). Global material utilities `.glass-mimi` and
`.glass-celestial` are canonical app-shell surfaces (accepted in `globals.css`).

## 5. Layout Principles
Mobile-first. No custom spacing scale — Tailwind defaults. Generous rounding vocabulary
(`rounded-2xl`, `rounded-[1.5rem]`, `rounded-[2rem]`, `rounded-full`). Atmospheric animated
background (`components/background/liquid-background.tsx`): floating blurred gradient orbs +
`.liquid-noise` texture. Page wrapper: `components/layout/page-shell.tsx`.

## 6. Depth & Elevation
Brand-tinted shadows only (matches the Tinted-Shadow/Glow pattern):
- `--shadow-warm` `0 8px 24px -6px rgba(89,46,46,0.15)` — brown, default surface
- `--shadow-glow-primary` `0 0 20px rgba(255,214,209,0.6)` — pink glow
- `--shadow-glow-accent` `0 0 20px rgba(212,175,55,0.4)` — gold glow
- `--shadow-glass` `0 8px 32px 0 rgba(31,38,135,0.15)` — **off-brand blue (see Known Drift)**

## 7. Do's & Don'ts
- ✅ Depth via blur + tinted glow, not hard borders.
- ✅ Warm-tinted shadows keyed to the palette (brown / pink / gold).
- ✅ Compose the primitives below; theme via semantic tokens.
- ❌ Don't use the blue `--shadow-glass` — it breaks the warm palette.
- ❌ Don't hardcode hex or raw Tailwind palette (`amber/indigo/emerald`) in components — use tokens.
- ❌ Don't leak dev-speak into copy; keep it Thai-first and benefit-led.

## 8. Responsive Behavior
Mobile-first, 44px touch targets, safe-area utilities (`.safe-top/.safe-bottom/...`).
Layout tokens in `:root`: `--mobile-bottom-nav-height: 80px`, `--mobile-bottom-clearance`.
Z-index hierarchy: content 1 → bottom-nav 50 → toast 60 → overlay 70 → modal 80 → critical 100.
Motion tokens: `float-slow` 15s, `float-delayed` 18s, `pulse-slow` 10s, `shimmer` 2s,
`fade-in-up`/`fade-in-down` 0.8s `cubic-bezier(0.2,0.8,0.2,1)`.

## 9. Agent Prompt Guide
> mmv-tarots is warm-glassmorphism (Tailwind v4 `@theme`). Palette: warm pink bg `#FFF0F0` /
> primary `#FFD6D1` → muted gold accent `#D4AF37` → warm brown text `#592E2E`. Material =
> translucent white + `backdrop-blur` + brand-tinted glow shadows (never neutral black); depth
> via blur/glow, not borders. Fonts: Montserrat (body), Merriweather (headings), Ubuntu Mono.
> Reuse first: `GlassButton` (primary/outline/ghost/icon/line), `GlassCard`, `Modal`,
> `FloatingBadge`, `QuestionInput`; `cn` from `@/lib/shared/utils`. Theme via semantic tokens;
> never hardcode hex or raw palette.

## Primitives (reuse-first)
| Primitive | File | Variants |
|-----------|------|----------|
| GlassButton | components/ui/button.tsx | primary, outline, ghost, icon, line |
| GlassCard | components/ui/card.tsx | — |
| Modal | components/ui/modal.tsx | — (composes GlassCard, framer-motion) |
| FloatingBadge | components/ui/floating-badge.tsx | position prop |
| QuestionInput | components/ui/question-input.tsx | content-aware flagship (auto-resize, meter) |

## Design Brain Links
- [[material-surface-hierarchy]] — mmv is a Tailwind-path implementation; adopt tier naming as it matures.
- [[tinted-shadow-glow]] — exact match; retire the lone off-brand blue shadow.
- [[layered-token-architecture]] — has system tokens but no distinct reference layer yet.
- [[content-aware-form-system]] — `QuestionInput` already follows it.

## Known Drift
- **Dual token source**: `app/globals.css @theme` (canonical) vs legacy `tailwind.config.ts`
  (v3-style ramps `50–950` + font map). Components still reference ramp shades (`bg-primary-950/40`
  in `modal.tsx`). Treat `@theme` as canonical; consolidate the ramp later.
- **Off-brand blue** `--shadow-glass` `rgba(31,38,135,0.15)` — the only non-warm shadow. Retire it.
- **Un-tokenized radii** — `rounded-[1.5rem]` / `[2rem]` are magic numbers; needs `--radius-*` tokens.
- **No `--font-*` tokens** — fonts live in config + hardcoded `body` font-family.
- **Raw-palette leaks** — `StatusBadge` uses `bg-amber-500/10` / `text-indigo-700`; landing CTAs
  use `from-yellow-400/20` / `from-purple-500/20`. Should route through semantic tokens.
