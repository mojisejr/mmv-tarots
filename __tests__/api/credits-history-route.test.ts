import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/services/credit-service', () => ({
  CreditService: {
    getHistory: vi.fn(),
  },
}));

import { GET } from '@/app/api/credits/history/route';
import { auth } from '@/lib/server/auth';
import { CreditService } from '@/services/credit-service';

describe('GET /api/credits/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

    const request = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/credits/history?page=1&limit=10'),
    } as any;

    const response = await GET(request as any);

    expect(response.status).toBe(401);
    expect(CreditService.getHistory).not.toHaveBeenCalled();
  });

  it('returns owner scoped history with pagination params', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user_001' },
    } as any);

    vi.mocked(CreditService.getHistory).mockResolvedValue({
      transactions: [
        {
          id: 'txn_001',
          amount: 120,
          balanceAfter: 120,
          type: 'TOPUP',
          status: 'SUCCESS',
          createdAt: '2026-03-18T12:00:00.000Z',
        },
      ],
      pagination: {
        page: 2,
        limit: 5,
        total: 1,
        totalPages: 1,
      },
    } as any);

    const request = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/credits/history?page=2&limit=5'),
    } as any;

    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.transactions).toHaveLength(1);
    expect(body.transactions[0].id).toBe('txn_001');
    expect(CreditService.getHistory).toHaveBeenCalledWith('user_001', 2, 5);
  });
});