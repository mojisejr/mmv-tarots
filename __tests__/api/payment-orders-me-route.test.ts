import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/db', () => ({
  db: {
    paymentOrder: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from '@/app/api/payment/orders/me/route';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

describe('GET /api/payment/orders/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user_001' },
    } as any);

    vi.mocked(db.paymentOrder.count).mockResolvedValue(1);
    vi.mocked(db.paymentOrder.findMany).mockResolvedValue([
      {
        id: 'ord_001',
        referenceCode: 'pay_ref_001',
        status: 'CREDITED',
        amountTHB: 299,
        amountSatang: 29900,
        currency: 'THB',
        createdAt: new Date('2026-03-17T14:00:00.000Z'),
        verifiedAt: new Date('2026-03-17T14:02:00.000Z'),
        creditedAt: new Date('2026-03-17T14:02:30.000Z'),
        verificationErrorCode: null,
        verificationErrorMessage: null,
        packagePrice: {
          id: 'price_001',
          package: {
            id: 'pkg_001',
            name: 'Starter Pack',
            stars: 120,
          },
        },
        creditTransaction: {
          id: 'txn_001',
          amount: 120,
          status: 'SUCCESS',
          createdAt: new Date('2026-03-17T14:02:30.000Z'),
        },
        verificationLogs: [
          {
            id: 'vlog_001',
            provider: 'SLIP_OK',
            status: 'SUCCESS',
            errorCode: null,
            errorMessage: null,
            createdAt: new Date('2026-03-17T14:02:10.000Z'),
          },
        ],
      },
    ] as any);
  });

  it('returns 401 for unauthenticated request', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

    const request = new Request('http://localhost/api/payment/orders/me', {
      method: 'GET',
    });

    const response = await GET(request as any);

    expect(response.status).toBe(401);
    expect(db.paymentOrder.findMany).not.toHaveBeenCalled();
  });

  it('returns owner orders with deterministic schema', async () => {
    const request = new Request('http://localhost/api/payment/orders/me?page=1&pageSize=10', {
      method: 'GET',
    });

    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].referenceCode).toBe('pay_ref_001');
    expect(body.data.items[0].package.name).toBe('Starter Pack');
    expect(body.data.items[0].creditedTransaction.id).toBe('txn_001');
    expect(body.data.items[0].latestVerificationLog.id).toBe('vlog_001');
    expect(body.data.items[0].errorCategory).toBe('UNKNOWN');
    expect(body.data.items[0].retryAfterMinutes).toBeNull();
    expect(body.data.items[0].delayMinutes).toBeNull();
    expect(body.data.pagination.total).toBe(1);

    expect(db.paymentOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user_001',
        }),
      })
    );
  });

  it('applies status filter and pagination constraints', async () => {
    const request = new Request(
      'http://localhost/api/payment/orders/me?page=0&pageSize=500&status=credited,rejected,INVALID',
      {
        method: 'GET',
      }
    );

    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.pageSize).toBe(50);
    expect(body.data.filters.status).toEqual(['CREDITED', 'REJECTED']);
    expect(db.paymentOrder.count).toHaveBeenCalledWith({
      where: {
        userId: 'user_001',
        status: {
          in: ['CREDITED', 'REJECTED'],
        },
      },
    });
  });

  it('maps semantic fields for delayed and receiver mismatch errors', async () => {
    vi.mocked(db.paymentOrder.count).mockResolvedValue(2);
    vi.mocked(db.paymentOrder.findMany).mockResolvedValue([
      {
        id: 'ord_1010',
        referenceCode: 'pay_ref_1010',
        status: 'VERIFYING',
        amountTHB: 299,
        amountSatang: 29900,
        currency: 'THB',
        createdAt: new Date('2026-03-17T14:00:00.000Z'),
        verifiedAt: null,
        creditedAt: null,
        verificationErrorCode: '1010',
        verificationErrorMessage: 'กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 7 นาที',
        packagePrice: {
          id: 'price_001',
          package: {
            id: 'pkg_001',
            name: 'Starter Pack',
            stars: 120,
          },
        },
        creditTransaction: null,
        verificationLogs: [],
      },
      {
        id: 'ord_1014',
        referenceCode: 'pay_ref_1014',
        status: 'REJECTED',
        amountTHB: 299,
        amountSatang: 29900,
        currency: 'THB',
        createdAt: new Date('2026-03-17T14:00:00.000Z'),
        verifiedAt: null,
        creditedAt: null,
        verificationErrorCode: '1014',
        verificationErrorMessage: 'บัญชีผู้รับไม่ตรงกับบัญชีหลักของร้าน',
        packagePrice: {
          id: 'price_002',
          package: {
            id: 'pkg_002',
            name: 'Pro Pack',
            stars: 300,
          },
        },
        creditTransaction: null,
        verificationLogs: [],
      },
    ] as any);

    const request = new Request('http://localhost/api/payment/orders/me?page=1&pageSize=10', {
      method: 'GET',
    });

    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items).toHaveLength(2);

    expect(body.data.items[0].errorCategory).toBe('DELAYED_RECHECK');
    expect(body.data.items[0].retryAfterMinutes).toBe(7);
    expect(body.data.items[0].delayMinutes).toBe(7);

    expect(body.data.items[1].errorCategory).toBe('RECEIVER_MISMATCH');
    expect(body.data.items[1].retryAfterMinutes).toBeNull();
    expect(body.data.items[1].delayMinutes).toBeNull();
  });
});