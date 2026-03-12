import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { paymentOrderService } from '@/lib/server/services/payment-order-service';
import { emitPaymentEvent } from '@/lib/server/payment-observability';
import { ApiError, ERROR_CODES, createErrorResponse } from '@/lib/server/errors';

const createOrderSchema = z.object({
  packagePriceId: z.string().min(1),
});

function getPromptPayTarget(): string | null {
  return (
    process.env.PROMPTPAY_TARGET_ID ??
    process.env.PROMPTPAY_RECEIVER_ID ??
    process.env.NEXT_PUBLIC_PROMPTPAY_TARGET_ID ??
    null
  );
}

function toSatang(amountTHB: number): number {
  return Math.round(amountTHB * 100);
}

function getOrderExpiry(): Date {
  const ttlMinutes = Number.parseInt(process.env.PAYMENT_ORDER_TTL_MINUTES ?? '15', 10);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
  return expiresAt;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      throw new ApiError({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }

    const promptPayTarget = getPromptPayTarget();
    if (!promptPayTarget) {
      return NextResponse.json(
        { error: 'PromptPay target is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid request payload',
        details: parsed.error.flatten(),
      });
    }

    const packagePrice = await db.packagePrice.findUnique({
      where: { id: parsed.data.packagePriceId },
      include: { package: true },
    });

    if (!packagePrice || !packagePrice.active || !packagePrice.package.active) {
      return NextResponse.json({ error: 'Package price not available' }, { status: 404 });
    }

    if (packagePrice.isPromo) {
      const previousTopups = await db.creditTransaction.count({
        where: {
          userId: session.user.id,
          type: 'TOPUP',
          status: 'SUCCESS',
        },
      });

      if (previousTopups > 0) {
        return NextResponse.json(
          { error: 'This promotion is for new customers only.' },
          { status: 403 }
        );
      }
    }

    const amountTHB = Number(packagePrice.amount);
    const amountSatang = toSatang(amountTHB);
    const expiresAt = getOrderExpiry();

    const order = await paymentOrderService.createOrder({
      userId: session.user.id,
      packagePriceId: packagePrice.id,
      amountTHB,
      amountSatang,
      currency: (packagePrice.currency ?? 'THB').toUpperCase(),
      expiresAt,
      metadata: {
        paymentFlowVersion: process.env.PAYMENT_FLOW_VERSION ?? 'v2',
        channel: 'PROMPTPAY_QR',
      },
    });

    emitPaymentEvent('payment.order.created', {
      orderId: order.id,
      userId: session.user.id,
      packagePriceId: packagePrice.id,
      amountTHB,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        referenceCode: order.referenceCode,
        status: order.status,
        amountTHB,
        amountSatang,
        currency: (packagePrice.currency ?? 'THB').toUpperCase(),
        expiresAt: expiresAt.toISOString(),
        package: {
          id: packagePrice.package.id,
          name: packagePrice.package.name,
          stars: packagePrice.package.stars,
        },
        promptpay: {
          targetId: promptPayTarget,
        },
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
