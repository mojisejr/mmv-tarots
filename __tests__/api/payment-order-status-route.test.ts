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
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/payment-observability', () => ({
  emitPaymentEvent: vi.fn(),
}));

import { GET } from '@/app/api/payment/orders/[id]/status/route';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

describe('GET /api/payment/orders/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PROMPTPAY_TARGET_ID = '004999039549117';

    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user_001' },
    } as any);
  });

  it('returns order status for owner', async () => {
    vi.mocked(db.paymentOrder.findUnique).mockResolvedValue({
      id: 'ord_001',
      userId: 'user_001',
      referenceCode: 'pay_ref_001',
      status: 'CREDITED',
      amountTHB: 299,
      amountSatang: 29900,
      currency: 'THB',
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      verifiedAt: new Date(),
      creditedAt: new Date(),
      packagePrice: {
        package: {
          id: 'pkg_001',
          name: 'Starter',
          stars: 100,
        },
      },
      verificationErrorCode: null,
      verificationErrorMessage: null,
      creditTransaction: {
        id: 'txn_001',
        amount: 100,
        createdAt: new Date(),
      },
    } as any);

    const request = new Request('http://localhost/api/payment/orders/ord_001/status', {
      method: 'GET',
    });

    const response = await GET(request as any, { params: Promise.resolve({ id: 'ord_001' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.order.status).toBe('CREDITED');
    expect(body.order.promptpay.targetId).toBe('004999039549117');
  });

  it('marks expired order as EXPIRED', async () => {
    vi.mocked(db.paymentOrder.findUnique).mockResolvedValue({
      id: 'ord_002',
      userId: 'user_001',
      referenceCode: 'pay_ref_002',
      status: 'PENDING_PAYMENT',
      amountTHB: 199,
      amountSatang: 19900,
      currency: 'THB',
      expiresAt: new Date(Date.now() - 1000),
      verifiedAt: null,
      creditedAt: null,
      packagePrice: {
        package: {
          id: 'pkg_001',
          name: 'Starter',
          stars: 100,
        },
      },
      verificationErrorCode: null,
      verificationErrorMessage: null,
      creditTransaction: null,
    } as any);

    vi.mocked(db.paymentOrder.update).mockResolvedValue({
      status: 'EXPIRED',
    } as any);

    const request = new Request('http://localhost/api/payment/orders/ord_002/status', {
      method: 'GET',
    });

    const response = await GET(request as any, { params: Promise.resolve({ id: 'ord_002' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.order.status).toBe('EXPIRED');
    expect(db.paymentOrder.update).toHaveBeenCalledTimes(1);
  });
});
