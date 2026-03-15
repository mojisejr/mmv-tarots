import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const testMocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockHeaders: vi.fn(),
  mockCookies: vi.fn(),
  mockGrantOnboardingBonus: vi.fn(),
  mockGrantReferralEntryBonus: vi.fn(),
  mockProcessReferralSignup: vi.fn(),
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

vi.mock('@/lib/server/db', () => ({
  db: {
    user: {
      findUnique: testMocks.mockUserFindUnique,
    },
    $transaction: testMocks.mockDbTransaction,
  },
}));

vi.mock('@/services/credit-service', () => ({
  CreditService: {
    grantOnboardingBonus: testMocks.mockGrantOnboardingBonus,
    grantReferralEntryBonus: testMocks.mockGrantReferralEntryBonus,
  },
}));

vi.mock('@/lib/server/services/referral-service', () => ({
  referralService: {
    processReferralSignup: testMocks.mockProcessReferralSignup,
  },
}));

import { PATCH } from '@/app/api/user/onboarding/route';

describe('PATCH /api/user/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockHeaders.mockResolvedValue(new Headers());
    testMocks.mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockUserFindUnique.mockResolvedValue({
      onboardingCompleted: false,
      referredById: null,
    });

    testMocks.mockDbTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        user: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });
  });

  it('returns 401 when unauthenticated', async () => {
    testMocks.mockGetSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('returns already completed when onboarding is already done', async () => {
    testMocks.mockUserFindUnique.mockResolvedValue({
      onboardingCompleted: true,
      referredById: null,
    });

    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, message: 'Already completed', reward: 0 });
    expect(testMocks.mockDbTransaction).not.toHaveBeenCalled();
  });

  it('grants onboarding bonus exactly once when user has no referrer', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      onboardingCompleted: true,
      ritual: 'completed',
      reward: 1,
    });

    expect(testMocks.mockGrantOnboardingBonus).toHaveBeenCalledTimes(1);
    expect(testMocks.mockGrantOnboardingBonus).toHaveBeenCalledWith('user-1', expect.any(Object));
    expect(testMocks.mockGrantReferralEntryBonus).not.toHaveBeenCalled();
  });

  it('grants referral entry bonus when user is linked to referrer', async () => {
    testMocks.mockUserFindUnique.mockResolvedValue({
      onboardingCompleted: false,
      referredById: 'referrer-1',
    });

    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reward).toBe(2);
    expect(testMocks.mockGrantOnboardingBonus).toHaveBeenCalledTimes(1);
    expect(testMocks.mockGrantReferralEntryBonus).toHaveBeenCalledTimes(1);
    expect(testMocks.mockGrantReferralEntryBonus).toHaveBeenCalledWith('user-1', 'referrer-1', expect.any(Object));
  });

  it('returns already completed when atomic lock update count is zero', async () => {
    testMocks.mockDbTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        user: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      return callback(tx);
    });

    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, message: 'Already completed', reward: 0 });
    expect(testMocks.mockGrantOnboardingBonus).not.toHaveBeenCalled();
    expect(testMocks.mockGrantReferralEntryBonus).not.toHaveBeenCalled();
  });

  it('attempts self-healing from mmv_ref cookie before ritual transaction', async () => {
    const cookieGet = vi.fn().mockReturnValue({ value: 'FRIEND777' });
    testMocks.mockCookies.mockResolvedValue({ get: cookieGet });

    const firstHeaders = new Headers({ 'x-forwarded-for': '10.20.30.40, 10.20.30.41' });
    const secondHeaders = new Headers({ 'x-forwarded-for': '10.20.30.40, 10.20.30.41' });
    testMocks.mockHeaders.mockResolvedValueOnce(firstHeaders).mockResolvedValueOnce(secondHeaders);

    testMocks.mockUserFindUnique
      .mockResolvedValueOnce({ onboardingCompleted: false, referredById: null })
      .mockResolvedValueOnce({ referredById: 'referrer-healed' });

    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reward).toBe(2);
    expect(testMocks.mockProcessReferralSignup).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'FRIEND777',
      '10.20.30.40'
    );
    expect(testMocks.mockGrantReferralEntryBonus).toHaveBeenCalledWith(
      'user-1',
      'referrer-healed',
      expect.any(Object)
    );
  });
});
