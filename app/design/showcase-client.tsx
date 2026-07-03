'use client';

import { useState } from 'react';
import { GlassButton, GlassCard, StatusBadge, Modal } from '@/components/ui';

// One page that renders every primitive + token from DESIGN.md. Reuse-first:
// it imports the real component exports, never re-implements them.

const COLOR_TOKENS: { name: string; token: string }[] = [
  { name: 'background', token: '--color-background' },
  { name: 'foreground', token: '--color-foreground' },
  { name: 'primary', token: '--color-primary' },
  { name: 'primary-strong', token: '--color-primary-strong' },
  { name: 'accent', token: '--color-accent' },
  { name: 'muted', token: '--color-muted' },
  { name: 'muted-foreground', token: '--color-muted-foreground' },
  { name: 'success', token: '--color-success' },
  { name: 'warning', token: '--color-warning' },
  { name: 'info', token: '--color-info' },
  { name: 'destructive', token: '--color-destructive' },
  { name: 'surface-card', token: '--color-surface-card' },
  { name: 'border-subtle', token: '--color-border-subtle' },
];

const SHADOW_TOKENS: { name: string; token: string }[] = [
  { name: 'shadow-warm', token: '--shadow-warm' },
  { name: 'shadow-glow-primary', token: '--shadow-glow-primary' },
  { name: 'shadow-glow-accent', token: '--shadow-glow-accent' },
];

const BUTTON_VARIANTS = ['primary', 'outline', 'ghost', 'icon', 'line'] as const;
const BADGE_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SUCCESS'] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section data-testid={`showcase-${id}`} className="mb-12">
      <h2 className="text-2xl font-serif text-foreground mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignShowcase() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main
      data-testid="design-showcase"
      className="min-h-screen bg-background text-foreground p-6 sm:p-10 max-w-5xl mx-auto"
    >
      <header className="mb-10">
        <h1 className="text-3xl font-serif text-foreground">mmv-tarots — Design Showcase</h1>
        <p className="text-text-muted mt-1">
          Canonical verify surface. Every token + primitive from <code>DESIGN.md</code>, dev-only.
        </p>
      </header>

      <Section id="colors" title="Color Tokens">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {COLOR_TOKENS.map(({ name, token }) => (
            <div key={token} data-testid={`swatch-${name}`} className="flex flex-col gap-2">
              <div
                className="h-16 rounded-2xl border border-border-subtle"
                style={{ background: `var(${token})` }}
              />
              <div className="text-xs">
                <div className="font-medium text-foreground">{name}</div>
                <code className="text-text-muted">{token}</code>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="typography" title="Typography">
        <div className="space-y-3">
          <p data-testid="type-body" className="font-sans text-base text-foreground">
            Body — Montserrat. The quick brown fox. เมมิกำลังรวบรวมสมาธิ
          </p>
          <p data-testid="type-heading" className="font-serif text-2xl text-foreground">
            Heading — Merriweather serif
          </p>
          <p data-testid="type-mono" className="font-mono text-sm text-text-muted">
            Mono — Ubuntu Mono · 00:42
          </p>
        </div>
      </Section>

      <Section id="depth" title="Depth &amp; Elevation">
        <div className="flex flex-wrap gap-6">
          {SHADOW_TOKENS.map(({ name, token }) => (
            <div key={token} className="flex flex-col items-center gap-2">
              <div
                data-testid={`shadow-${name}`}
                className="h-20 w-20 rounded-2xl bg-surface-card"
                style={{ boxShadow: `var(${token})` }}
              />
              <code className="text-xs text-text-muted">{name}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section id="buttons" title="GlassButton (variants)">
        <div className="flex flex-wrap items-center gap-4">
          {BUTTON_VARIANTS.map((variant) => (
            <GlassButton
              key={variant}
              variant={variant}
              data-testid={`primitive-button-${variant}`}
            >
              {variant}
            </GlassButton>
          ))}
          <GlassButton variant="primary" isLoading data-testid="primitive-button-loading">
            loading
          </GlassButton>
        </div>
      </Section>

      <Section id="card" title="GlassCard">
        <GlassCard data-testid="primitive-card" className="max-w-md">
          <h3 className="font-serif text-lg text-foreground mb-2">Reading of the day</h3>
          <p className="text-text-muted text-sm">
            Translucent surface, brand-tinted warm shadow, soft border — composed from the real
            <code> GlassCard</code> primitive.
          </p>
        </GlassCard>
      </Section>

      <Section id="badges" title="StatusBadge (statuses)">
        <div className="flex flex-wrap gap-3">
          {BADGE_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section id="modal" title="Modal">
        <GlassButton variant="outline" onClick={() => setModalOpen(true)} data-testid="modal-trigger">
          Open Modal
        </GlassButton>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modal primitive">
          <p className="text-text-muted">
            Framer-motion modal composed from <code>GlassCard</code>. ESC or backdrop closes it.
          </p>
        </Modal>
      </Section>
    </main>
  );
}
