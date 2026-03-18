import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const testMocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockClaimReferralCode: vi.fn(),
}));

vi.mock('@/lib/server/auth', () => ({
  auth: {
    api: {
      getSession: testMocks.mockGetSession,
    },
  },
}));

vi.mock('@/lib/server/services/referral-claim-service', () => ({
  referralClaimService: {
    claimReferralCode: testMocks.mockClaimReferralCode,
  },
}));

import { POST } from '@/app/api/user/referral-claim/route';

describe('/api/user/referral-claim route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockClaimReferralCode.mockResolvedValue({
      status: 200,
      body: {
        success: true,
        referredById: 'referrer-2',
        message: 'Referral code claimed successfully',
      },
    });
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
    expect(testMocks.mockClaimReferralCode).not.toHaveBeenCalled();
  });

  it('returns 400 when code is missing', async () => {
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
    expect(testMocks.mockClaimReferralCode).not.toHaveBeenCalled();
  });

  it('delegates claim logic to source-aware claim service', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND777' }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '1.2.3.4, 1.2.3.5',
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
    expect(testMocks.mockClaimReferralCode).toHaveBeenCalledWith({
      userId: 'user-1',
      code: 'FRIEND777',
      ipAddress: '1.2.3.4',
    });
  });

  it('forwards conflict responses from orchestration', async () => {
    testMocks.mockClaimReferralCode.mockResolvedValue({
      status: 409,
      body: { error: 'Manual claim is blocked for link-attributed users' },
    });

    const request = new NextRequest('http://localhost:3000/api/user/referral-claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'FRIEND777' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ error: 'Manual claim is blocked for link-attributed users' });
  });
});
