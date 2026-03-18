import { PaymentOrderStatus, VerificationProvider } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/db', () => ({
  db: {
    paymentOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    paymentVerificationLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/server/payment-observability', () => ({
  emitPaymentEvent: vi.fn(),
}));

vi.mock('@/services/credit-service', () => ({
  CreditService: {
    addStars: vi.fn(),
  },
}));

vi.mock('@/lib/server/services/slip-verification-service', () => ({
  slipVerificationService: {
    verify: vi.fn(),
  },
}));

import { db } from '@/lib/server/db';
import { emitPaymentEvent } from '@/lib/server/payment-observability';
import { paymentFulfillmentService } from '@/lib/server/services/payment-fulfillment-service';
import { slipVerificationService } from '@/lib/server/services/slip-verification-service';
import { CreditService } from '@/services/credit-service';

function buildOrder(overrides: Partial<any> = {}) {
  return {
    id: 'ord_001',
    userId: 'user_001',
    amountTHB: 299,
    status: PaymentOrderStatus.PENDING_PAYMENT,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    referenceCode: 'pay_ref_001',
    packagePriceId: 'price_001',
    packagePrice: {
      packageId: 'pkg_001',
      package: {
        stars: 120,
      },
    },
    ...overrides,
  };
}

describe('payment-fulfillment-service phase3 state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps order in VERIFYING for delayed bank case (1010)', async () => {
    vi.mocked(db.paymentOrder.findUnique).mockResolvedValue(buildOrder() as any);
    vi.mocked(slipVerificationService.verify).mockResolvedValue({
      success: false,
      provider: VerificationProvider.SLIP_OK,
      errorCode: '1010',
      errorCategory: 'DELAYED_RECHECK',
      errorMessage: 'กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 7 นาที',
      raw: { code: 1010 },
    });

    const result = await paymentFulfillmentService.submitSlip({
      orderId: 'ord_001',
      userId: 'user_001',
      slipImageUrl: 'https://cdn.example/slip.jpg',
    });

    expect(result.status).toBe(PaymentOrderStatus.VERIFYING);
    expect(result.credited).toBe(false);

    expect(db.paymentVerificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING_RECHECK',
          errorCode: '1010',
        }),
      })
    );

    expect(db.paymentOrder.update).toHaveBeenLastCalledWith({
      where: { id: 'ord_001' },
      data: {
        status: PaymentOrderStatus.VERIFYING,
        verificationProvider: VerificationProvider.SLIP_OK,
        verificationErrorCode: '1010',
        verificationErrorMessage: 'กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 7 นาที',
      },
    });

    expect(emitPaymentEvent).toHaveBeenCalledWith(
      'payment.order.verification_pending',
      expect.objectContaining({
        orderId: 'ord_001',
        reason: '1010',
      })
    );
  });

  it('keeps order in VERIFYING for temporary outage case (1009)', async () => {
    vi.mocked(db.paymentOrder.findUnique).mockResolvedValue(buildOrder() as any);
    vi.mocked(slipVerificationService.verify).mockResolvedValue({
      success: false,
      provider: VerificationProvider.SLIP_OK,
      errorCode: '1009',
      errorCategory: 'TEMPORARY',
      errorMessage: 'ระบบธนาคารปลายทางขัดข้องชั่วคราว',
      raw: { code: 1009 },
    });

    const result = await paymentFulfillmentService.submitSlip({
      orderId: 'ord_001',
      userId: 'user_001',
      slipImageUrl: 'https://cdn.example/slip.jpg',
    });

    expect(result.status).toBe(PaymentOrderStatus.VERIFYING);
    expect(result.errorCode).toBe('1009');
    expect(result.credited).toBe(false);

    expect(db.paymentVerificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING_RECHECK',
        }),
      })
    );
  });

  it('rejects duplicate slip (1012) without crediting', async () => {
    vi.mocked(db.paymentOrder.findUnique).mockResolvedValue(buildOrder() as any);
    vi.mocked(slipVerificationService.verify).mockResolvedValue({
      success: false,
      provider: VerificationProvider.SLIP_OK,
      errorCode: '1012',
      errorCategory: 'DUPLICATE',
      errorMessage: 'สลิปนี้เคยถูกใช้ตรวจสอบแล้ว',
      raw: { code: 1012 },
    });

    const result = await paymentFulfillmentService.submitSlip({
      orderId: 'ord_001',
      userId: 'user_001',
      slipImageUrl: 'https://cdn.example/slip.jpg',
    });

    expect(result.status).toBe(PaymentOrderStatus.REJECTED);
    expect(result.credited).toBe(false);

    expect(db.paymentVerificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          errorCode: '1012',
        }),
      })
    );

    expect(emitPaymentEvent).toHaveBeenCalledWith(
      'payment.order.rejected',
      expect.objectContaining({
        orderId: 'ord_001',
        reason: '1012',
      })
    );

    expect(CreditService.addStars).not.toHaveBeenCalled();
  });

  it('preserves idempotency when order is already credited in race path', async () => {
    const order = buildOrder();

    vi.mocked(db.paymentOrder.findUnique)
      .mockResolvedValueOnce(order as any)
      .mockResolvedValueOnce({ status: PaymentOrderStatus.CREDITED } as any);

    vi.mocked(slipVerificationService.verify).mockResolvedValue({
      success: true,
      provider: VerificationProvider.SLIP_OK,
      amountTHB: 299,
      externalRef: 'TRX-001',
      raw: { success: true },
    });

    const txOrderFindUnique = vi.fn().mockResolvedValue({
      id: 'ord_001',
      status: PaymentOrderStatus.CREDITED,
      creditedAt: new Date(),
    });
    const txOrderUpdate = vi.fn();

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      return callback({
        paymentOrder: {
          findUnique: txOrderFindUnique,
          update: txOrderUpdate,
        },
      });
    });

    const result = await paymentFulfillmentService.submitSlip({
      orderId: 'ord_001',
      userId: 'user_001',
      slipImageUrl: 'https://cdn.example/slip.jpg',
    });

    expect(result.status).toBe(PaymentOrderStatus.CREDITED);
    expect(result.credited).toBe(true);
    expect(result.alreadyCredited).toBe(true);
    expect(CreditService.addStars).not.toHaveBeenCalled();
    expect(txOrderUpdate).not.toHaveBeenCalled();
  });
});