import { PaymentOrderStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { emitPaymentEvent } from '@/lib/server/payment-observability';
import { CreditService } from '@/services/credit-service';
import { slipVerificationService } from '@/lib/server/services/slip-verification-service';

export interface SubmitSlipInput {
  orderId: string;
  userId: string;
  slipImageUrl: string;
}

export interface SubmitSlipResult {
  orderId: string;
  status: PaymentOrderStatus;
  credited: boolean;
  alreadyCredited: boolean;
  starsGranted: number;
  errorCode?: string;
  errorMessage?: string;
}

function isOrderTerminal(status: PaymentOrderStatus): boolean {
  return (
    status === PaymentOrderStatus.CREDITED ||
    status === PaymentOrderStatus.EXPIRED
  );
}

export const paymentFulfillmentService = {
  async submitSlip(input: SubmitSlipInput): Promise<SubmitSlipResult> {
    const order = await db.paymentOrder.findUnique({
      where: { id: input.orderId },
      include: {
        packagePrice: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!order || order.userId !== input.userId) {
      throw new Error('PAYMENT_ORDER_NOT_FOUND');
    }

    const now = new Date();
    if (order.expiresAt <= now && order.status !== PaymentOrderStatus.CREDITED) {
      await db.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: PaymentOrderStatus.EXPIRED,
        },
      });

      return {
        orderId: order.id,
        status: PaymentOrderStatus.EXPIRED,
        credited: false,
        alreadyCredited: false,
        starsGranted: 0,
        errorCode: 'ORDER_EXPIRED',
        errorMessage: 'Payment order has expired.',
      };
    }

    if (order.status === PaymentOrderStatus.CREDITED) {
      return {
        orderId: order.id,
        status: PaymentOrderStatus.CREDITED,
        credited: true,
        alreadyCredited: true,
        starsGranted: order.packagePrice.package.stars,
      };
    }

    if (isOrderTerminal(order.status)) {
      return {
        orderId: order.id,
        status: order.status,
        credited: false,
        alreadyCredited: false,
        starsGranted: 0,
        errorCode: 'ORDER_NOT_PROCESSABLE',
        errorMessage: `Order is in terminal state: ${order.status}`,
      };
    }

    await db.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: PaymentOrderStatus.SLIP_UPLOADED,
        slipImageUrl: input.slipImageUrl,
      },
    });

    await db.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: PaymentOrderStatus.VERIFYING,
      },
    });

    const verifyResult = await slipVerificationService.verify({
      paymentOrderId: order.id,
      slipImageUrl: input.slipImageUrl,
    });

    await db.paymentVerificationLog.create({
      data: {
        paymentOrderId: order.id,
        provider: verifyResult.provider,
        status: verifyResult.success ? 'SUCCESS' : 'FAILED',
        errorCode: verifyResult.errorCode,
        errorMessage: verifyResult.errorMessage,
        requestPayload: { slipImageUrl: input.slipImageUrl },
        responsePayload: verifyResult.raw as Prisma.InputJsonValue,
      },
    });

    if (!verifyResult.success) {
      await db.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: PaymentOrderStatus.REJECTED,
          verificationProvider: verifyResult.provider,
          verificationErrorCode: verifyResult.errorCode,
          verificationErrorMessage: verifyResult.errorMessage,
        },
      });

      emitPaymentEvent('payment.order.rejected', {
        orderId: order.id,
        userId: input.userId,
        reason: verifyResult.errorCode ?? 'UNKNOWN',
      });

      return {
        orderId: order.id,
        status: PaymentOrderStatus.REJECTED,
        credited: false,
        alreadyCredited: false,
        starsGranted: 0,
        errorCode: verifyResult.errorCode,
        errorMessage: verifyResult.errorMessage,
      };
    }

    const expectedAmount = Number(order.amountTHB);
    const verifiedAmount = verifyResult.amountTHB;
    if (
      typeof verifiedAmount === 'number' &&
      Math.abs(verifiedAmount - expectedAmount) > 0.01
    ) {
      await db.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: PaymentOrderStatus.REJECTED,
          verificationProvider: verifyResult.provider,
          verificationErrorCode: 'AMOUNT_MISMATCH',
          verificationErrorMessage: `Expected ${expectedAmount.toFixed(2)} THB but got ${verifiedAmount.toFixed(2)} THB`,
        },
      });

      return {
        orderId: order.id,
        status: PaymentOrderStatus.REJECTED,
        credited: false,
        alreadyCredited: false,
        starsGranted: 0,
        errorCode: 'AMOUNT_MISMATCH',
        errorMessage: 'Slip amount does not match the order amount.',
      };
    }

    await db.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: PaymentOrderStatus.VERIFIED,
        verifiedAt: new Date(),
        verificationProvider: verifyResult.provider,
        verificationErrorCode: null,
        verificationErrorMessage: null,
      },
    });

    let alreadyCredited = false;

    try {
      await db.$transaction(async (tx) => {
        const lockedOrder = await tx.paymentOrder.findUnique({
          where: { id: order.id },
          select: { id: true, status: true, creditedAt: true },
        });

        if (!lockedOrder) {
          throw new Error('PAYMENT_ORDER_NOT_FOUND');
        }

        if (lockedOrder.status === PaymentOrderStatus.CREDITED) {
          alreadyCredited = true;
          return;
        }

        await CreditService.addStars(
          input.userId,
          order.packagePrice.package.stars,
          {
            paymentOrderId: order.id,
            externalRef: verifyResult.externalRef ?? order.referenceCode,
            channel: 'PROMPTPAY_QR',
            amountTHB: expectedAmount,
            packagePriceId: order.packagePriceId,
            packageId: order.packagePrice.packageId,
            verificationProvider: verifyResult.provider,
            creditedVia: 'slip-verification',
          },
          tx
        );

        await tx.paymentOrder.update({
          where: { id: order.id },
          data: {
            status: PaymentOrderStatus.CREDITED,
            creditedAt: new Date(),
            verifiedAt: new Date(),
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        alreadyCredited = true;
      } else {
        throw error;
      }
    }

    const finalized = await db.paymentOrder.findUnique({
      where: { id: order.id },
      select: { status: true },
    });

    const credited = finalized?.status === PaymentOrderStatus.CREDITED || alreadyCredited;

    if (credited) {
      emitPaymentEvent('payment.order.credited', {
        orderId: order.id,
        userId: input.userId,
        stars: order.packagePrice.package.stars,
      });
    }

    return {
      orderId: order.id,
      status: credited ? PaymentOrderStatus.CREDITED : PaymentOrderStatus.VERIFIED,
      credited,
      alreadyCredited,
      starsGranted: credited ? order.packagePrice.package.stars : 0,
    };
  },
};
