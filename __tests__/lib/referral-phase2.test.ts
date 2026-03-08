import { describe, expect, it } from 'vitest';
import { ReferralUtils } from '@/lib/referral-utils';
import { buildGatewayTarget } from '@/app/liff/page';

describe('Phase 5.2 referral hardening', () => {
  it('generates LIFF wrapped referral link on root path', () => {
    process.env.NEXT_PUBLIC_LIFF_ID = '1234567890-abcDEF';

    const link = ReferralUtils.generateLink('https://maemormimi.com', 'REFCODE');

    expect(link).toBe('https://liff.line.me/1234567890-abcDEF/?ref=REFCODE');
  });

  it('preserves existing query params and appends ref on sub-path', () => {
    process.env.NEXT_PUBLIC_LIFF_ID = '1234567890-abcDEF';

    const link = ReferralUtils.generateLink(
      'https://maemormimi.com',
      'REF777',
      '/share/abc123?from=profile'
    );

    expect(link).toBe('https://liff.line.me/1234567890-abcDEF/share/abc123?from=profile&ref=REF777');
  });

  it('falls back to origin link when LIFF ID is missing', () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;

    const link = ReferralUtils.generateLink('https://maemormimi.com', 'FALLBACK', '/history');

    expect(link).toBe('https://maemormimi.com/history?ref=FALLBACK');
  });

  it('keeps LIFF wrapped path without ref when referral code is not provided', () => {
    process.env.NEXT_PUBLIC_LIFF_ID = '1234567890-abcDEF';

    const link = ReferralUtils.generateLink('https://maemormimi.com', undefined, '/package?tier=gold');

    expect(link).toBe('https://liff.line.me/1234567890-abcDEF/package?tier=gold');
  });

  it('forwards ref query from /liff to target when liff.state has no ref', () => {
    const target = buildGatewayTarget('/profile', 'PROMO999');
    expect(target).toBe('/profile?ref=PROMO999');
  });

  it('does not overwrite existing ref in liff.state target', () => {
    const target = buildGatewayTarget('/profile?ref=EXISTING', 'NEWCODE');
    expect(target).toBe('/profile?ref=EXISTING');
  });

  it('forwards ref while preserving existing query params in liff.state target', () => {
    const target = buildGatewayTarget('/submitted?job=abc123&from=liff', 'PROMO888');
    expect(target).toBe('/submitted?job=abc123&from=liff&ref=PROMO888');
  });
});
