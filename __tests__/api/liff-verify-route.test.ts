import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const testMocks = vi.hoisted(() => {
  const mockInternalAdapter = {
    findAccountByProviderId: vi.fn(),
    findUserById: vi.fn(),
    findUserByEmail: vi.fn(),
    createOAuthUser: vi.fn(),
    linkAccount: vi.fn(),
    createSession: vi.fn(),
  };

  const mockAuthContext = {
    internalAdapter: mockInternalAdapter,
    secret: 'test-secret',
    sessionConfig: {
      expiresIn: 60 * 60,
    },
  };

  const mockAuth = {
    $context: Promise.resolve(mockAuthContext),
    options: {},
  };

  const mockSetSignedCookie = vi.fn();
  const mockCreateInternalContext = vi.fn(async () => ({
    setSignedCookie: mockSetSignedCookie,
  }));

  const mockGetCookies = vi.fn(() => ({
    sessionToken: {
      name: 'mmv_auth.session_token',
      options: {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax' as const,
      },
    },
  }));

  return {
    mockInternalAdapter,
    mockSetSignedCookie,
    mockCreateInternalContext,
    mockGetCookies,
    mockAuth,
  };
});

vi.mock('@/lib/server/auth', () => ({
  auth: testMocks.mockAuth,
}));

vi.mock('better-call', () => ({
  createInternalContext: testMocks.mockCreateInternalContext,
}));

vi.mock('better-auth/cookies', () => ({
  getCookies: testMocks.mockGetCookies,
}));

import { POST } from '@/app/api/auth/liff-verify/route';

describe('/api/auth/liff-verify route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    testMocks.mockInternalAdapter.findAccountByProviderId.mockResolvedValue(null);
    testMocks.mockInternalAdapter.findUserByEmail.mockResolvedValue(null);
    testMocks.mockInternalAdapter.createOAuthUser.mockResolvedValue({
      user: { id: 'user-1' },
    });
    testMocks.mockInternalAdapter.createSession.mockResolvedValue({ token: 'session-token-1' });

    testMocks.mockSetSignedCookie.mockResolvedValue('mmv_auth.session_token=signed-token; Path=/; HttpOnly');

    vi.stubGlobal('fetch', vi.fn());
    process.env.LINE_CHANNEL_ID = 'line-channel-123';
  });

  it('returns 400 when payload is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/liff-verify', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ ok: false, error: 'Invalid request payload' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 401 when LINE token verification fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    const request = new NextRequest('http://localhost:3000/api/auth/liff-verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken: 'bad-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ ok: false, error: 'Invalid LINE access token' });
  });

  it('returns 401 when LINE channel id mismatches', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client_id: 'unexpected-channel',
          expires_in: 3600,
        }),
      } as Response);

    const request = new NextRequest('http://localhost:3000/api/auth/liff-verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken: 'valid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ ok: false, error: 'LINE channel mismatch' });
  });

  it('creates session and sets signed cookie on success', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client_id: 'line-channel-123',
          expires_in: 3600,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'line-user-123',
          displayName: 'LINE User',
          pictureUrl: 'https://image.example',
        }),
      } as Response);

    const request = new NextRequest('http://localhost:3000/api/auth/liff-verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken: 'valid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(testMocks.mockInternalAdapter.createSession).toHaveBeenCalledWith('user-1');
    expect(testMocks.mockCreateInternalContext).toHaveBeenCalledTimes(1);
    expect(testMocks.mockSetSignedCookie).toHaveBeenCalledWith(
      'mmv_auth.session_token',
      'session-token-1',
      'test-secret',
      expect.objectContaining({
        maxAge: 60 * 60,
      })
    );

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toContain('mmv_auth.session_token=signed-token');
  });
});
