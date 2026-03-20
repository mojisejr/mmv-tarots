import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Surface audit: ensures standard pages under BottomNav do not
 * use hardcoded bottom-nav spacing workarounds.
 *
 * These patterns are banned per the Page-Shell Contract.
 * Bottom clearance is owned by the root layout via --mobile-bottom-clearance.
 */

const STANDARD_PAGES = [
  'app/package/page.tsx',
  'app/billing/page.tsx',
  'app/transactions/page.tsx',
  'app/policy/privacy/page.tsx',
  'app/policy/refund/page.tsx',
  'app/policy/terms/page.tsx',
];

const BANNED_PATTERNS = [
  /\bpb-2[0-9]\b/,
  /\bpb-3[0-9]\b/,
  /\bz-50\b/,
  /\bz-\[50\]/,
  /\bbottom-24\b/,
];

describe('Surface Audit: no hardcoded bottom-nav spacing', () => {
  const root = path.resolve(__dirname, '..');

  STANDARD_PAGES.forEach((pagePath) => {
    it(`${pagePath} has no banned spacing patterns`, () => {
      const filePath = path.join(root, pagePath);
      const content = fs.readFileSync(filePath, 'utf8');

      BANNED_PATTERNS.forEach((pattern) => {
        expect(content).not.toMatch(pattern);
      });
    });
  });
});

describe('Surface Audit: standard pages use PageShell', () => {
  const root = path.resolve(__dirname, '..');

  STANDARD_PAGES.forEach((pagePath) => {
    it(`${pagePath} imports PageShell`, () => {
      const filePath = path.join(root, pagePath);
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toMatch(/PageShell/);
    });
  });
});

describe('Shell token contract: globals.css has required tokens', () => {
  const root = path.resolve(__dirname, '..');

  it('defines --mobile-bottom-clearance token', () => {
    const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
    expect(css).toContain('--mobile-bottom-clearance');
  });

  it('defines z-layer tokens', () => {
    const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
    expect(css).toContain('--z-bottom-nav');
    expect(css).toContain('--z-modal');
    expect(css).toContain('--z-content');
    expect(css).toContain('--z-toast');
    expect(css).toContain('--z-critical-overlay');
  });
});

describe('Shell layering: components use token-based z-index', () => {
  const root = path.resolve(__dirname, '..');

  it('bottom-nav uses z-[var(--z-bottom-nav)]', () => {
    const content = fs.readFileSync(path.join(root, 'components/layout/bottom-nav.tsx'), 'utf8');
    expect(content).toContain('var(--z-bottom-nav)');
    expect(content).not.toMatch(/\bz-50\b/);
  });

  it('modal uses z-[var(--z-modal)]', () => {
    const content = fs.readFileSync(path.join(root, 'components/ui/modal.tsx'), 'utf8');
    expect(content).toContain('var(--z-modal)');
    expect(content).not.toMatch(/\bz-50\b/);
  });

  it('root layout uses --mobile-bottom-clearance for main', () => {
    const content = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
    expect(content).toContain('var(--mobile-bottom-clearance)');
  });
});
