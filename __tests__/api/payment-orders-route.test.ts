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
    paymentOrder: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/services/payment-order-service', () => ({
  paymentOrderService: {
    createOrder: vi.fn(),
    findActiveOrder: vi.fn(),
    findReusableDraftOrder: vi.fn(),
    reviveDraftOrder: vi.fn(),
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

    vi.mocked(paymentOrderService.findActiveOrder).mockResolvedValue(null);

    vi.mocked(paymentOrderService.findReusableDraftOrder).mockResolvedValue(null);

    vi.mocked(paymentOrderService.createOrder).mockResolvedValue({
      id: 'ord_001',
      referenceCode: 'pay_ref_001',
      status: 'PENDING_PAYMENT',
      reused: false,
      reuseMode: 'new',
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

  it('returns existing active order instead of creating new one', async () => {
    vi.mocked(paymentOrderService.findActiveOrder).mockResolvedValue({
      id: 'ord_existing',
      referenceCode: 'pay_ref_existing',
      status: 'PENDING_PAYMENT',
      reused: true,
      reuseMode: 'active',
    } as any);

    vi.mocked(db.paymentOrder.findUnique).mockResolvedValue({
      expiresAt: new Date('2026-03-20T00:00:00Z'),
    } as any);

    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_001' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.order.id).toBe('ord_existing');
    expect(body.order.reused).toBe(true);
    expect(paymentOrderService.createOrder).not.toHaveBeenCalled();
  });

  it('creates new order when no active order exists', async () => {
    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_001' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.order.reused).toBe(false);
    expect(body.order.reuseMode).toBe('new');
    expect(paymentOrderService.createOrder).toHaveBeenCalledTimes(1);
  });

  it('revives expired draft when no active order exists but revivable draft found', async () => {
    vi.mocked(paymentOrderService.findReusableDraftOrder).mockResolvedValue({
      id: 'ord_draft_expired',
      referenceCode: 'pay_ref_draft',
      status: 'EXPIRED',
      reused: true,
      reuseMode: 'revived',
    } as any);

    vi.mocked(paymentOrderService.reviveDraftOrder).mockResolvedValue({
      id: 'ord_draft_expired',
      referenceCode: 'pay_ref_draft',
      status: 'PENDING_PAYMENT',
      reused: true,
      reuseMode: 'revived',
    } as any);

    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_001' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.order.id).toBe('ord_draft_expired');
    expect(body.order.reused).toBe(true);
    expect(body.order.reuseMode).toBe('revived');
    expect(paymentOrderService.reviveDraftOrder).toHaveBeenCalledWith(
      'ord_draft_expired',
      expect.any(Date),
    );
    expect(paymentOrderService.createOrder).not.toHaveBeenCalled();
  });

  it('creates new order when neither active nor revivable draft exists', async () => {
    vi.mocked(paymentOrderService.findActiveOrder).mockResolvedValue(null);
    vi.mocked(paymentOrderService.findReusableDraftOrder).mockResolvedValue(null);

    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_001' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.order.reused).toBe(false);
    expect(body.order.reuseMode).toBe('new');
    expect(paymentOrderService.createOrder).toHaveBeenCalledTimes(1);
    expect(paymentOrderService.reviveDraftOrder).not.toHaveBeenCalled();
  });

  it('emits payment.order.revived event when draft is revived', async () => {
    const { emitPaymentEvent } = await import('@/lib/server/payment-observability');

    vi.mocked(paymentOrderService.findReusableDraftOrder).mockResolvedValue({
      id: 'ord_revive',
      referenceCode: 'pay_ref_revive',
      status: 'EXPIRED',
      reused: true,
      reuseMode: 'revived',
    } as any);

    vi.mocked(paymentOrderService.reviveDraftOrder).mockResolvedValue({
      id: 'ord_revive',
      referenceCode: 'pay_ref_revive',
      status: 'PENDING_PAYMENT',
      reused: true,
      reuseMode: 'revived',
    } as any);

    const request = new Request('http://localhost/api/payment/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packagePriceId: 'price_001' }),
    });

    await POST(request as any);

    expect(emitPaymentEvent).toHaveBeenCalledWith('payment.order.revived', {
      orderId: 'ord_revive',
      userId: 'user_001',
      packagePriceId: 'price_001',
      amountTHB: 299,
    });
  });
});
