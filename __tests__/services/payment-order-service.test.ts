import { PaymentOrderStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/db', () => ({
  db: {
    paymentOrder: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { db } from '@/lib/server/db';
import { paymentOrderService } from '@/lib/server/services/payment-order-service';

describe('payment-order-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findActiveOrder', () => {
    it('returns active order with reuseMode active', async () => {
      vi.mocked(db.paymentOrder.findFirst).mockResolvedValue({
        id: 'ord_active',
        referenceCode: 'pay_ref_active',
        status: PaymentOrderStatus.PENDING_PAYMENT,
      } as any);

      const result = await paymentOrderService.findActiveOrder('user_001', 'price_001', 'PROMPTPAY_QR');

      expect(result).toEqual({
        id: 'ord_active',
        referenceCode: 'pay_ref_active',
        status: PaymentOrderStatus.PENDING_PAYMENT,
        reused: true,
        reuseMode: 'active',
      });
    });

    it('returns null when no active order found', async () => {
      vi.mocked(db.paymentOrder.findFirst).mockResolvedValue(null);

      const result = await paymentOrderService.findActiveOrder('user_001', 'price_001', 'PROMPTPAY_QR');

      expect(result).toBeNull();
    });
  });

  describe('findReusableDraftOrder', () => {
    it('returns revivable expired draft with no slip evidence', async () => {
      vi.mocked(db.paymentOrder.findFirst).mockResolvedValue({
        id: 'ord_draft',
        referenceCode: 'pay_ref_draft',
        status: PaymentOrderStatus.EXPIRED,
        slipImageUrl: null,
      } as any);

      const result = await paymentOrderService.findReusableDraftOrder('user_001', 'price_001', 'PROMPTPAY_QR');

      expect(result).toEqual({
        id: 'ord_draft',
        referenceCode: 'pay_ref_draft',
        status: PaymentOrderStatus.EXPIRED,
        reused: true,
        reuseMode: 'revived',
      });
    });

    it('returns null when draft has slip evidence', async () => {
      vi.mocked(db.paymentOrder.findFirst).mockResolvedValue({
        id: 'ord_with_slip',
        referenceCode: 'pay_ref_slip',
        status: PaymentOrderStatus.EXPIRED,
        slipImageUrl: 'direct-upload://slip.jpg',
      } as any);

      const result = await paymentOrderService.findReusableDraftOrder('user_001', 'price_001', 'PROMPTPAY_QR');

      expect(result).toBeNull();
    });

    it('returns null when no revivable draft found', async () => {
      vi.mocked(db.paymentOrder.findFirst).mockResolvedValue(null);

      const result = await paymentOrderService.findReusableDraftOrder('user_001', 'price_001', 'PROMPTPAY_QR');

      expect(result).toBeNull();
    });

    it('queries with correct revivable status filter and guards', async () => {
      vi.mocked(db.paymentOrder.findFirst).mockResolvedValue(null);

      await paymentOrderService.findReusableDraftOrder('user_001', 'price_001', 'PROMPTPAY_QR');

      expect(db.paymentOrder.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user_001',
            packagePriceId: 'price_001',
            status: { in: [PaymentOrderStatus.PENDING_PAYMENT, PaymentOrderStatus.EXPIRED] },
            slipImageUrl: null,
            creditedAt: null,
            verificationLogs: { none: {} },
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('reviveDraftOrder', () => {
    it('resets draft to PENDING_PAYMENT with new expiry and keeps referenceCode', async () => {
      const newExpiry = new Date('2026-03-20T10:00:00Z');

      vi.mocked(db.paymentOrder.update).mockResolvedValue({
        id: 'ord_revived',
        referenceCode: 'pay_ref_original',
        status: PaymentOrderStatus.PENDING_PAYMENT,
      } as any);

      const result = await paymentOrderService.reviveDraftOrder('ord_revived', newExpiry);

      expect(result).toEqual({
        id: 'ord_revived',
        referenceCode: 'pay_ref_original',
        status: PaymentOrderStatus.PENDING_PAYMENT,
        reused: true,
        reuseMode: 'revived',
      });

      expect(db.paymentOrder.update).toHaveBeenCalledWith({
        where: { id: 'ord_revived' },
        data: {
          status: PaymentOrderStatus.PENDING_PAYMENT,
          expiresAt: newExpiry,
          verificationErrorCode: null,
          verificationErrorMessage: null,
        },
        select: { id: true, referenceCode: true, status: true },
      });
    });
  });

  describe('createOrder', () => {
    it('creates new order with reuseMode new', async () => {
      vi.mocked(db.paymentOrder.create).mockResolvedValue({
        id: 'ord_new',
        referenceCode: 'pay_ref_new',
        status: PaymentOrderStatus.PENDING_PAYMENT,
      } as any);

      const result = await paymentOrderService.createOrder({
        userId: 'user_001',
        packagePriceId: 'price_001',
        amountTHB: 299,
        amountSatang: 29900,
        currency: 'THB',
        expiresAt: new Date(),
        metadata: { channel: 'PROMPTPAY_QR' },
      });

      expect(result.reused).toBe(false);
      expect(result.reuseMode).toBe('new');
    });
  });
});
