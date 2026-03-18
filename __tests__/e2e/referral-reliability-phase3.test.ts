import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const testMocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
  mockCookies: vi.fn(),
  mockCompleteOnboarding: vi.fn(),
  mockClaimReferralCode: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: testMocks.mockHeaders,
  cookies: testMocks.mockCookies,
}));

vi.mock('@/lib/server/auth', () => ({
  auth: {
    api: {
      getSession: testMocks.mockGetSession,
    },
  },
}));

vi.mock('@/lib/server/services/onboarding-orchestration-service', () => ({
  onboardingOrchestrationService: {
    completeOnboarding: testMocks.mockCompleteOnboarding,
  },
}));

vi.mock('@/lib/server/services/referral-claim-service', () => ({
  referralClaimService: {
    claimReferralCode: testMocks.mockClaimReferralCode,
  },
}));

import { middleware } from '@/middleware';
import { ReferralUtils } from '@/lib/referral-utils';
import { POST as claimReferralCode } from '@/app/api/user/referral-claim/route';
import { PATCH as completeOnboarding } from '@/app/api/user/onboarding/route';
import { POST as referralCheck } from '@/app/api/auth/referral-check/route';

describe('Phase 3 - Referral Reliability E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockHeaders.mockResolvedValue(new Headers({ 'x-forwarded-for': '1.2.3.4' }));
    testMocks.mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    testMocks.mockClaimReferralCode.mockResolvedValue({
      status: 200,
      body: {
        success: true,
        referredById: 'referrer-2',
        message: 'Referral code claimed successfully',
      },
    });

    testMocks.mockCompleteOnboarding
      .mockResolvedValueOnce({ status: 'completed', reward: 1 })
      .mockResolvedValueOnce({ status: 'already_completed', reward: 0 });
  });

  it('captures first-touch share ref and keeps it on reopen', () => {
    const generated = ReferralUtils.generatePredictionLink(
      'https://maemormimi.com',
      'pred-123',
      'FRIEND777'
    );

    expect(generated).toContain('/share/pred-123?ref=FRIEND777');

    const firstRequest = new NextRequest('https://maemormimi.com/share/pred-123?ref=FRIEND777');
    const firstResponse = middleware(firstRequest);
    const firstCookie = firstResponse.cookies.get('mmv_ref');

    expect(firstCookie?.value).toBe('FRIEND777');

    const reopenedRequest = new NextRequest('https://maemormimi.com/share/pred-123?ref=NEW999', {
      headers: {
        cookie: 'mmv_ref=FRIEND777',
      },
    });
    const reopenedResponse = middleware(reopenedRequest);
    const reopenedCookie = reopenedResponse.cookies.get('mmv_ref');

    expect(reopenedCookie).toBeUndefined();
  });

  it('supports manual claim path and blocks duplicate onboarding payouts on replay', async () => {
    const claimRequest = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND777' }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '1.2.3.4, 1.2.3.5',
      },
    });

    const claimResponse = await claimReferralCode(claimRequest);
    const claimData = await claimResponse.json();

    expect(claimResponse.status).toBe(200);
    expect(claimData).toEqual({
      success: true,
      referredById: 'referrer-2',
      message: 'Referral code claimed successfully',
    });

    const firstOnboardingRequest = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });
    const firstOnboardingResponse = await completeOnboarding(firstOnboardingRequest);
    const firstOnboardingData = await firstOnboardingResponse.json();

    expect(firstOnboardingResponse.status).toBe(200);
    expect(firstOnboardingData).toMatchObject({
      success: true,
      ritual: 'completed',
      reward: 1,
    });

    const replayOnboardingRequest = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });
    const replayOnboardingResponse = await completeOnboarding(replayOnboardingRequest);
    const replayOnboardingData = await replayOnboardingResponse.json();

    expect(replayOnboardingResponse.status).toBe(200);
    expect(replayOnboardingData).toEqual({ success: true, message: 'Already completed', reward: 0 });

    expect(testMocks.mockCompleteOnboarding).toHaveBeenCalledTimes(2);
  });

  it('keeps legacy referral-check endpoint as no-op even on repeated calls', async () => {
    const firstRequest = new NextRequest('http://localhost:3000/api/auth/referral-check', {
      method: 'POST',
      headers: { Cookie: 'mmv_ref=FRIEND777' },
    });
    const firstResponse = await referralCheck(firstRequest);
    const firstData = await firstResponse.json();

    const secondRequest = new NextRequest('http://localhost:3000/api/auth/referral-check', {
      method: 'POST',
      headers: { Cookie: 'mmv_ref=FRIEND777' },
    });
    const secondResponse = await referralCheck(secondRequest);
    const secondData = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstData).toEqual({
      success: true,
      legacy: true,
      message: 'Referral check skipped. Onboarding gate is the source of truth.',
    });
    expect(secondResponse.status).toBe(200);
    expect(secondData).toEqual(firstData);
  });
});
