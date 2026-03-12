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
    },
  },
}));

vi.mock('@/lib/server/services/payment-fulfillment-service', () => ({
  paymentFulfillmentService: {
    submitSlip: vi.fn(),
  },
}));

vi.mock('@/lib/server/services/line-oa-notification-service', () => ({
  lineOaNotificationService: {
    notifyPaymentCredited: vi.fn(),
  },
}));

vi.mock('@/lib/server/payment-observability', () => ({
  emitPaymentEvent: vi.fn(),
  notifyPaymentAlert: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '@/app/api/payment/orders/[id]/slip/route';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { paymentFulfillmentService } from '@/lib/server/services/payment-fulfillment-service';
import { lineOaNotificationService } from '@/lib/server/services/line-oa-notification-service';

describe('POST /api/payment/orders/[id]/slip', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user_001' },
    } as any);

    vi.mocked(db.paymentOrder.findUnique).mockResolvedValue({
      referenceCode: 'pay_ref_001',
    } as any);

    vi.mocked(lineOaNotificationService.notifyPaymentCredited).mockResolvedValue({
      sent: true,
    });
  });

  it('credits order and triggers line notification hook', async () => {
    vi.mocked(paymentFulfillmentService.submitSlip).mockResolvedValue({
      orderId: 'ord_001',
      status: 'CREDITED',
      credited: true,
      alreadyCredited: false,
      starsGranted: 100,
    } as any);

    const request = new Request('http://localhost/api/payment/orders/ord_001/slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipImageUrl: 'https://cdn.example/slip.jpg' }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('CREDITED');
    expect(lineOaNotificationService.notifyPaymentCredited).toHaveBeenCalledTimes(1);
  });

  it('returns 422 for rejected slips', async () => {
    vi.mocked(paymentFulfillmentService.submitSlip).mockResolvedValue({
      orderId: 'ord_001',
      status: 'REJECTED',
      credited: false,
      alreadyCredited: false,
      starsGranted: 0,
      errorCode: 'INVALID_SLIP',
      errorMessage: 'Slip not valid',
    } as any);

    const request = new Request('http://localhost/api/payment/orders/ord_001/slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipImageUrl: 'https://cdn.example/slip.jpg' }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });

    expect(response.status).toBe(422);
    expect(lineOaNotificationService.notifyPaymentCredited).not.toHaveBeenCalled();
  });

  it('returns 404 when order is missing', async () => {
    vi.mocked(paymentFulfillmentService.submitSlip).mockRejectedValue(
      new Error('PAYMENT_ORDER_NOT_FOUND')
    );

    const request = new Request('http://localhost/api/payment/orders/ord_missing/slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipImageUrl: 'https://cdn.example/slip.jpg' }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_missing' }) });

    expect(response.status).toBe(404);
  });
});
