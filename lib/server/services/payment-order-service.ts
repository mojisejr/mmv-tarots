import { randomUUID } from 'crypto';
import { PaymentOrderStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';

export interface CreatePaymentOrderInput {
  userId: string;
  packagePriceId: string;
  amountTHB: number;
  amountSatang: number;
  currency?: string;
  expiresAt: Date;
  metadata?: Prisma.InputJsonValue;
}

export interface CreatePaymentOrderResult {
  id: string;
  referenceCode: string;
  status: PaymentOrderStatus;
}

function generateReferenceCode(): string {
  return `pay_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export const paymentOrderService = {
  async createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    const order = await db.paymentOrder.create({
      data: {
        userId: input.userId,
        packagePriceId: input.packagePriceId,
        amountTHB: new Prisma.Decimal(input.amountTHB),
        amountSatang: input.amountSatang,
        currency: input.currency ?? 'THB',
        status: PaymentOrderStatus.PENDING_PAYMENT,
        referenceCode: generateReferenceCode(),
        expiresAt: input.expiresAt,
        metadata: input.metadata,
      },
      select: {
        id: true,
        referenceCode: true,
        status: true,
      },
    });

    return order;
  },
};
