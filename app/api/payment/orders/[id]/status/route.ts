import { NextRequest, NextResponse } from 'next/server';
import { PaymentOrderStatus } from '@prisma/client';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { emitPaymentEvent } from '@/lib/server/payment-observability';

function getPromptPayTarget(): string | null {
  return (
    process.env.PROMPTPAY_TARGET_ID ??
    process.env.PROMPTPAY_RECEIVER_ID ??
    process.env.NEXT_PUBLIC_PROMPTPAY_TARGET_ID ??
    null
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Order id is required' }, { status: 400 });
  }

  const order = await db.paymentOrder.findUnique({
    where: { id },
    include: {
      packagePrice: {
        include: {
          package: true,
        },
      },
      creditTransaction: {
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
  }

  let status = order.status;
  if (
    order.status !== PaymentOrderStatus.CREDITED &&
    order.status !== PaymentOrderStatus.REJECTED &&
    order.expiresAt <= new Date()
  ) {
    const expiredOrder = await db.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: PaymentOrderStatus.EXPIRED,
      },
    });
    status = expiredOrder.status;
  }

  emitPaymentEvent('payment.order.status_polled', {
    orderId: order.id,
    userId: session.user.id,
    status,
  });

  const promptPayTarget = getPromptPayTarget();

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      referenceCode: order.referenceCode,
      status,
      amountTHB: Number(order.amountTHB),
      amountSatang: order.amountSatang,
      currency: order.currency,
      expiresAt: order.expiresAt,
      verifiedAt: order.verifiedAt,
      creditedAt: order.creditedAt,
      package: {
        id: order.packagePrice.package.id,
        name: order.packagePrice.package.name,
        stars: order.packagePrice.package.stars,
      },
      verificationErrorCode: order.verificationErrorCode,
      verificationErrorMessage: order.verificationErrorMessage,
      creditedTransaction: order.creditTransaction,
      promptpay: {
        targetId: promptPayTarget,
      },
    },
  });
}
