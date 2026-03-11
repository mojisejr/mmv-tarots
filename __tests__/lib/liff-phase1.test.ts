import { describe, expect, it } from 'vitest';
import { buildLiffGatewayPath } from '@/lib/client/auth/session-shell-contract';
import { buildGatewayTarget, resolveDurableGatewayTarget, resolveLiffStateTarget } from '@/app/liff/page';

describe('Phase 5.1 LIFF gateway helpers', () => {
  it('builds /liff url with encoded mmv_next from pathname + query', () => {
    const nextPath = buildLiffGatewayPath('/history', '?ref=ABC123');
    expect(nextPath).toBe('/liff?mmv_next=%2Fhistory%3Fref%3DABC123');
  });

  it('builds /liff url from home route when query is empty', () => {
    const nextPath = buildLiffGatewayPath('/', '');
    expect(nextPath).toBe('/liff?mmv_next=%2F');
  });

  it('resolves valid liff.state to safe target', () => {
    expect(resolveLiffStateTarget('%2Fprofile%3Fref%3DXYZ')).toBe('/profile?ref=XYZ');
  });

  it('falls back to home for invalid target', () => {
    expect(resolveLiffStateTarget('https%3A%2F%2Fevil.com')).toBe('/');
    expect(resolveLiffStateTarget(null)).toBe('/');
  });

  it('falls back to home for malformed URI sequence', () => {
    expect(resolveLiffStateTarget('%E0%A4%A')).toBe('/');
  });

  it('keeps target when referral already exists and appends when missing', () => {
    expect(buildGatewayTarget('%2Fhistory%3Fref%3DOLD', 'NEW')).toBe('/history?ref=OLD');
    expect(buildGatewayTarget('%2Fhistory', 'NEW')).toBe('/history?ref=NEW');
  });

  it('recovers from persisted target when mmv_next is missing', () => {
    expect(resolveDurableGatewayTarget(null, null, '/profile?tab=saved')).toBe('/profile?tab=saved');
  });

  it('uses persisted target when mmv_next is malformed', () => {
    expect(resolveDurableGatewayTarget('https%3A%2F%2Fevil.com', 'PROMO1', '/history?from=liff')).toBe('/history?from=liff&ref=PROMO1');
  });
});
