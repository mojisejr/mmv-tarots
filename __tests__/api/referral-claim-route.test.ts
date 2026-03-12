import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const testMocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockDbUserFindUnique: vi.fn(),
  mockProcessReferralSignup: vi.fn(),
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
      findUnique: testMocks.mockDbUserFindUnique,
    },
  },
}));

vi.mock('@/lib/server/services/referral-service', () => ({
  referralService: {
    processReferralSignup: testMocks.mockProcessReferralSignup,
  },
}));

import { POST } from '@/app/api/user/referral-claim/route';

describe('/api/user/referral-claim route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    testMocks.mockGetSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND123' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when code is missing', async () => {
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: '' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Referral code is required' });
  });

  it('returns 409 when user already has referredById', async () => {
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockDbUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        referralCode: 'MYCODE',
        referredById: 'referrer-1',
        onboardingCompleted: false,
      });

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND123' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ error: 'Referral already claimed' });
  });

  it('returns 409 when onboarding is already completed', async () => {
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockDbUserFindUnique.mockResolvedValueOnce({
      id: 'user-1',
      referralCode: 'MYCODE',
      referredById: null,
      onboardingCompleted: true,
    });

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND123' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ error: 'Referral claim window has ended' });
  });

  it('rejects self-referral code', async () => {
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockDbUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        referralCode: 'SELF123',
        referredById: null,
        onboardingCompleted: false,
      });

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'SELF123' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Self referral is not allowed' });
    expect(testMocks.mockProcessReferralSignup).not.toHaveBeenCalled();
  });

  it('returns 404 when referral code is invalid', async () => {
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockDbUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        referralCode: 'SELF123',
        referredById: null,
        onboardingCompleted: false,
      })
      .mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'UNKNOWN999' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Referral code is invalid' });
    expect(testMocks.mockProcessReferralSignup).not.toHaveBeenCalled();
  });

  it('claims referral code successfully when eligible', async () => {
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockDbUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        referralCode: 'SELF123',
        referredById: null,
        onboardingCompleted: false,
      })
      .mockResolvedValueOnce({
        id: 'referrer-2',
      })
      .mockResolvedValueOnce({
        referredById: 'referrer-2',
      });

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND777' }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '1.2.3.4',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      referredById: 'referrer-2',
      message: 'Referral code claimed successfully',
    });
    expect(testMocks.mockProcessReferralSignup).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      'FRIEND777',
      '1.2.3.4'
    );
  });
});
