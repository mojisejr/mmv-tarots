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
  reuseMode: 'active' | 'revived' | 'new';
}

const ACTIVE_REUSABLE_STATUSES: PaymentOrderStatus[] = [
  PaymentOrderStatus.PENDING_PAYMENT,
  PaymentOrderStatus.SLIP_UPLOADED,
  PaymentOrderStatus.VERIFYING,
  PaymentOrderStatus.VERIFIED,
];

/** Statuses that had slip evidence or reached verification — must never be revived as draft */
const NON_REVIVABLE_STATUSES: PaymentOrderStatus[] = [
  PaymentOrderStatus.SLIP_UPLOADED,
  PaymentOrderStatus.VERIFYING,
  PaymentOrderStatus.VERIFIED,
  PaymentOrderStatus.CREDITED,
  PaymentOrderStatus.REJECTED,
];

function generateReferenceCode(): string {
  return `pay_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

function hasSlipEvidence(order: { slipImageUrl: string | null }): boolean {
  return order.slipImageUrl != null;
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
        status: { in: ACTIVE_REUSABLE_STATUSES },
        expiresAt: { gt: new Date() },
        metadata: { path: ['channel'], equals: channel },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, referenceCode: true, status: true },
    });

    if (!existing) return null;

    return { ...existing, reused: true, reuseMode: 'active' };
  },

  /**
   * Find the latest expired draft order that can be revived.
   * A draft is revivable only if:
   * - status is PENDING_PAYMENT or EXPIRED
   * - has no slipImageUrl (no slip evidence)
   * - has no verification logs
   * - has no creditedAt
   */
  async findReusableDraftOrder(
    userId: string,
    packagePriceId: string,
    channel: string,
  ): Promise<CreatePaymentOrderResult | null> {
    const draft = await db.paymentOrder.findFirst({
      where: {
        userId,
        packagePriceId,
        status: {
          in: [PaymentOrderStatus.PENDING_PAYMENT, PaymentOrderStatus.EXPIRED],
        },
        slipImageUrl: null,
        creditedAt: null,
        metadata: { path: ['channel'], equals: channel },
        verificationLogs: { none: {} },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, referenceCode: true, status: true, slipImageUrl: true },
    });

    if (!draft) return null;

    // Double-check: never revive if slip evidence exists
    if (hasSlipEvidence(draft)) return null;

    return {
      id: draft.id,
      referenceCode: draft.referenceCode,
      status: draft.status,
      reused: true,
      reuseMode: 'revived',
    };
  },

  /**
   * Revive an expired/stale draft order by resetting it to PENDING_PAYMENT
   * with a fresh expiresAt. Keeps the same referenceCode for continuity.
   */
  async reviveDraftOrder(
    orderId: string,
    newExpiresAt: Date,
  ): Promise<CreatePaymentOrderResult> {
    const updated = await db.paymentOrder.update({
      where: { id: orderId },
      data: {
        status: PaymentOrderStatus.PENDING_PAYMENT,
        expiresAt: newExpiresAt,
        verificationErrorCode: null,
        verificationErrorMessage: null,
      },
      select: { id: true, referenceCode: true, status: true },
    });

    return { ...updated, reused: true, reuseMode: 'revived' };
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

    return { ...order, reused: false, reuseMode: 'new' };
  },
};
