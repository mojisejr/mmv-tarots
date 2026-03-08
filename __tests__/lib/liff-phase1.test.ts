import { describe, expect, it } from 'vitest';
import { buildLiffGatewayPath } from '@/lib/client/providers/navigation-provider';
import { resolveLiffStateTarget } from '@/app/liff/page';

describe('Phase 5.1 LIFF gateway helpers', () => {
  it('builds /liff url with encoded liff.state from pathname + query', () => {
    const nextPath = buildLiffGatewayPath('/history', '?ref=ABC123');
    expect(nextPath).toBe('/liff?liff.state=%2Fhistory%3Fref%3DABC123');
  });

  it('builds /liff url from home route when query is empty', () => {
    const nextPath = buildLiffGatewayPath('/', '');
    expect(nextPath).toBe('/liff?liff.state=%2F');
  });

  it('resolves valid liff.state to safe target', () => {
    expect(resolveLiffStateTarget('%2Fprofile%3Fref%3DXYZ')).toBe('/profile?ref=XYZ');
  });

  it('falls back to home for invalid target', () => {
    expect(resolveLiffStateTarget('https%3A%2F%2Fevil.com')).toBe('/');
    expect(resolveLiffStateTarget(null)).toBe('/');
  });
});
