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
  reused: boolean;
}

const REUSABLE_STATUSES: PaymentOrderStatus[] = [
  PaymentOrderStatus.PENDING_PAYMENT,
  PaymentOrderStatus.SLIP_UPLOADED,
  PaymentOrderStatus.VERIFYING,
  PaymentOrderStatus.VERIFIED,
];

function generateReferenceCode(): string {
  return `pay_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export const paymentOrderService = {
  async findActiveOrder(
    userId: string,
    packagePriceId: string,
    channel: string,
  ): Promise<CreatePaymentOrderResult | null> {
    const existing = await db.paymentOrder.findFirst({
      where: {
        userId,
        packagePriceId,
        status: { in: REUSABLE_STATUSES },
        expiresAt: { gt: new Date() },
        metadata: { path: ['channel'], equals: channel },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, referenceCode: true, status: true },
    });

    if (!existing) return null;

    return { ...existing, reused: true };
  },

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

    return { ...order, reused: false };
  },
};
