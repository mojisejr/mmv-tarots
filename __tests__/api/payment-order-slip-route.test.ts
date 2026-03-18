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

const JPEG_HEADER = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);

function buildSlipFormData(filename = 'slip.jpg', mime = 'image/jpeg', content: Uint8Array = JPEG_HEADER): FormData {
  const formData = new FormData();
  const file = new File([content], filename, { type: mime });
  formData.append('slipFile', file);
  return formData;
}

function buildMultipartRequest(url: string, formData: FormData): Request {
  return new Request(url, { method: 'POST', body: formData });
}

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

    const formData = buildSlipFormData();
    const request = buildMultipartRequest('http://localhost/api/payment/orders/ord_001/slip', formData);

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('CREDITED');
    expect(paymentFulfillmentService.submitSlip).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord_001',
        userId: 'user_001',
        slipFile: expect.objectContaining({
          mimeType: 'image/jpeg',
          buffer: expect.any(Buffer),
        }),
      })
    );
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

    const formData = buildSlipFormData();
    const request = buildMultipartRequest('http://localhost/api/payment/orders/ord_001/slip', formData);

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });

    expect(response.status).toBe(422);
    expect(lineOaNotificationService.notifyPaymentCredited).not.toHaveBeenCalled();
  });

  it('returns 200 with VERIFYING for delayed recheck status', async () => {
    vi.mocked(paymentFulfillmentService.submitSlip).mockResolvedValue({
      orderId: 'ord_001',
      status: 'VERIFYING',
      credited: false,
      alreadyCredited: false,
      starsGranted: 0,
      errorCode: '1010',
      errorMessage: 'กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 7 นาที',
    } as any);

    const formData = buildSlipFormData();
    const request = buildMultipartRequest('http://localhost/api/payment/orders/ord_001/slip', formData);

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('VERIFYING');
    expect(lineOaNotificationService.notifyPaymentCredited).not.toHaveBeenCalled();
  });

  it('returns 422 for expired orders', async () => {
    vi.mocked(paymentFulfillmentService.submitSlip).mockResolvedValue({
      orderId: 'ord_001',
      status: 'EXPIRED',
      credited: false,
      alreadyCredited: false,
      starsGranted: 0,
      errorCode: 'ORDER_EXPIRED',
      errorMessage: 'Payment order has expired.',
    } as any);

    const formData = buildSlipFormData();
    const request = buildMultipartRequest('http://localhost/api/payment/orders/ord_001/slip', formData);

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.status).toBe('EXPIRED');
    expect(lineOaNotificationService.notifyPaymentCredited).not.toHaveBeenCalled();
  });

  it('returns 404 when order is missing', async () => {
    vi.mocked(paymentFulfillmentService.submitSlip).mockRejectedValue(
      new Error('PAYMENT_ORDER_NOT_FOUND')
    );

    const formData = buildSlipFormData();
    const request = buildMultipartRequest('http://localhost/api/payment/orders/ord_missing/slip', formData);

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_missing' }) });

    expect(response.status).toBe(404);
  });

  it('rejects unsupported file type with 422', async () => {
    const formData = buildSlipFormData('document.pdf', 'application/pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    const request = buildMultipartRequest('http://localhost/api/payment/orders/ord_001/slip', formData);

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.message).toContain('JPG');
    expect(paymentFulfillmentService.submitSlip).not.toHaveBeenCalled();
  });

  it('rejects request without slipFile field', async () => {
    const formData = new FormData();
    formData.append('otherField', 'someValue');
    const request = buildMultipartRequest('http://localhost/api/payment/orders/ord_001/slip', formData);

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });

    expect(response.status).toBe(422);
    expect(paymentFulfillmentService.submitSlip).not.toHaveBeenCalled();
  });

  it('rejects non-multipart request body', async () => {
    const request = new Request('http://localhost/api/payment/orders/ord_001/slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipImageUrl: 'https://example.com/slip.jpg' }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'ord_001' }) });

    expect(response.status).toBe(422);
    expect(paymentFulfillmentService.submitSlip).not.toHaveBeenCalled();
  });
});
