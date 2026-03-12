import { beforeEach, describe, expect, it } from 'vitest';
import { ReferralUtils } from '@/lib/referral-utils';
import { buildGatewayTarget } from '@/app/liff/page';

describe('Phase 5.2 referral hardening', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('generates canonical web referral link on root path', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://maemormimi.com';

    const link = ReferralUtils.generateLink('https://maemormimi.com', 'REFCODE');

    expect(link).toBe('https://maemormimi.com/?ref=REFCODE');
  });

  it('preserves existing query params and appends ref on sub-path', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.maemormimi.com';

    const link = ReferralUtils.generateLink(
      'https://maemormimi.com',
      'REF777',
      '/share/abc123?from=profile'
    );

    expect(link).toBe('https://www.maemormimi.com/share/abc123?from=profile&ref=REF777');
  });

  it('falls back to origin link when app url is missing', () => {

    const link = ReferralUtils.generateLink('https://maemormimi.com', 'FALLBACK', '/history');

    expect(link).toBe('https://maemormimi.com/history?ref=FALLBACK');
  });

  it('keeps canonical path without ref when referral code is not provided', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://maemormimi.com/';

    const link = ReferralUtils.generateLink('https://maemormimi.com', undefined, '/package?tier=gold');

    expect(link).toBe('https://maemormimi.com/package?tier=gold');
  });

  it('builds profile invite link through the canonical invite helper', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.maemormimi.com';

    const link = ReferralUtils.generateInviteLink('https://local.mimi', 'PROFILE777');

    expect(link).toBe('https://www.maemormimi.com/?ref=PROFILE777');
  });

  it('builds prediction share link through the canonical prediction helper', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.maemormimi.com';

    const link = ReferralUtils.generatePredictionLink('https://local.mimi', 'abc123', 'CARD555');

    expect(link).toBe('https://www.maemormimi.com/share/abc123?ref=CARD555');
  });

  it('composes invite payload with both url and code in full message', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://maemormimi.com';

    const payload = ReferralUtils.composeInvitePayload('https://local.mimi', 'INV123');

    expect(payload.url).toBe('https://maemormimi.com/?ref=INV123');
    expect(payload.code).toBe('INV123');
    expect(payload.message).toContain('ลิงก์ใช้งาน: https://maemormimi.com/?ref=INV123');
    expect(payload.message).toContain('ถ้าลิงก์เข้าไม่ได้ ให้กรอกรหัสนี้: INV123');
  });

  it('composes prediction payload with both url and code in full message', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.maemormimi.com';

    const payload = ReferralUtils.composePredictionPayload('https://local.mimi', 'job123', 'The Sun', 'SUN999');

    expect(payload.url).toBe('https://www.maemormimi.com/share/job123?ref=SUN999');
    expect(payload.text).toContain('รหัสแนะนำ: SUN999');
    expect(payload.message).toContain('ลิงก์ใช้งาน: https://www.maemormimi.com/share/job123?ref=SUN999');
    expect(payload.message).toContain('ถ้าลิงก์เข้าไม่ได้ ให้กรอกรหัสนี้: SUN999');
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
