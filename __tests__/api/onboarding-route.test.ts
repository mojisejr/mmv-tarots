import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const testMocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
  mockCookies: vi.fn(),
  mockCompleteOnboarding: vi.fn(),
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

import { PATCH } from '@/app/api/user/onboarding/route';

describe('PATCH /api/user/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockHeaders.mockResolvedValue(new Headers({ 'x-forwarded-for': '10.20.30.40' }));
    testMocks.mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    testMocks.mockCompleteOnboarding.mockResolvedValue({
      status: 'completed',
      reward: 1,
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
    expect(testMocks.mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('delegates onboarding flow to orchestration service with cookie and ip context', async () => {
    testMocks.mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'FRIEND777' }),
    });

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

    expect(testMocks.mockCompleteOnboarding).toHaveBeenCalledWith({
      userId: 'user-1',
      referralCodeFromCookie: 'FRIEND777',
      ipAddress: '10.20.30.40',
    });
  });

  it('returns already completed when orchestration reports idempotent replay', async () => {
    testMocks.mockCompleteOnboarding.mockResolvedValue({
      status: 'already_completed',
      reward: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, message: 'Already completed', reward: 0 });
  });

  it('returns 500 on orchestration failure', async () => {
    testMocks.mockCompleteOnboarding.mockRejectedValue(new Error('boom'));

    const request = new NextRequest('http://localhost:3000/api/user/onboarding', {
      method: 'PATCH',
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Ritual Failed' });
  });
});
