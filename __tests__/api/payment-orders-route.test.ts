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
    packagePrice: {
      findUnique: vi.fn(),
    },
    creditTransaction: {
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/services/payment-order-service', () => ({
  paymentOrderService: {
    createOrder: vi.fn(),
  },
}));

vi.mock('@/lib/server/payment-observability', () => ({
  emitPaymentEvent: vi.fn(),
}));

import { POST } from '@/app/api/payment/orders/route';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { paymentOrderService } from '@/lib/server/services/payment-order-service';

describe('POST /api/payment/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PROMPTPAY_TARGET_ID = '0899999999';

    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user_001' },
    } as any);

    vi.mocked(db.packagePrice.findUnique).mockResolvedValue({
      id: 'price_001',
      packageId: 'pkg_001',
      amount: 299,
      currency: 'THB',
      active: true,
      isPromo: false,
      package: {
        id: 'pkg_001',
        name: 'Starter Pack',
        stars: 120,
        active: true,
      },
    } as any);

    vi.mocked(db.creditTransaction.count).mockResolvedValue(0);

    vi.mocked(paymentOrderService.createOrder).mockResolvedValue({
      id: 'ord_001',
      referenceCode: 'pay_ref_001',
      status: 'PENDING_PAYMENT',
    } as any);
  });

  it('creates payment order successfully', async () => {
    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_001' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.order.id).toBe('ord_001');
    expect(body.order.promptpay.targetId).toBe('0899999999');
    expect(paymentOrderService.createOrder).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_001' }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(401);
  });

  it('blocks promo package for returning topup users', async () => {
    vi.mocked(db.packagePrice.findUnique).mockResolvedValue({
      id: 'price_promo',
      packageId: 'pkg_001',
      amount: 99,
      currency: 'THB',
      active: true,
      isPromo: true,
      package: {
        id: 'pkg_001',
        name: 'Promo Pack',
        stars: 80,
        active: true,
      },
    } as any);

    vi.mocked(db.creditTransaction.count).mockResolvedValue(1);

    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_promo' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('promotion');
  });
});
