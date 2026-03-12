import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const testMocks = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/server/auth', () => ({
  auth: {
    api: {
      getSession: testMocks.mockGetSession,
    },
  },
}));

import { POST } from '@/app/api/auth/referral-check/route';

describe('/api/auth/referral-check route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    testMocks.mockGetSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/referral-check', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('returns legacy no-op response for authenticated user', async () => {
    testMocks.mockGetSession.mockResolvedValue({
      user: { id: 'user-123' },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/referral-check', {
      method: 'POST',
      headers: {
        Cookie: 'mmv_ref=ABC999',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      legacy: true,
      message: 'Referral check skipped. Onboarding gate is the source of truth.',
    });
  });
});
