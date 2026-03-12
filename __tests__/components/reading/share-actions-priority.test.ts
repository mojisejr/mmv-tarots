import { describe, expect, it } from 'vitest';
import { resolveShareActionOrder } from '@/lib/client/share-action-order';

describe('share-actions LIFF priority', () => {
  it('prioritizes code-first actions in LIFF mode', () => {
    const order = resolveShareActionOrder(true, true);
    expect(order[0]).toBe('copy-code');
    expect(order[1]).toBe('copy-message');
    expect(order[2]).toBe('copy-link');
  });

  it('keeps link-first order in non-LIFF mode', () => {
    const order = resolveShareActionOrder(false, true);
    expect(order[0]).toBe('copy-link');
    expect(order[1]).toBe('copy-message');
  });

  it('hides copy-code action when referral code is unavailable', () => {
    const liffOrder = resolveShareActionOrder(true, false);
    const browserOrder = resolveShareActionOrder(false, false);

    expect(liffOrder).not.toContain('copy-code');
    expect(browserOrder).not.toContain('copy-code');
  });
});
