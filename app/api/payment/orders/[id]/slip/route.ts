import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { ApiError, ERROR_CODES, createErrorResponse } from '@/lib/server/errors';
import { emitPaymentEvent, notifyPaymentAlert } from '@/lib/server/payment-observability';
import { lineOaNotificationService } from '@/lib/server/services/line-oa-notification-service';
import { paymentFulfillmentService } from '@/lib/server/services/payment-fulfillment-service';

const submitSlipSchema = z.object({
  slipImageUrl: z.string().url(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      throw new ApiError({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = submitSlipSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid request payload',
        details: parsed.error.flatten(),
      });
    }

    const result = await paymentFulfillmentService.submitSlip({
      orderId: id,
      userId: session.user.id,
      slipImageUrl: parsed.data.slipImageUrl,
    });

    const order = await db.paymentOrder.findUnique({
      where: { id },
      select: {
        referenceCode: true,
      },
    });

    if (result.credited && order?.referenceCode) {
      const notifyResult = await lineOaNotificationService.notifyPaymentCredited({
        userId: session.user.id,
        stars: result.starsGranted,
        orderReferenceCode: order.referenceCode,
      });

      emitPaymentEvent('payment.order.credit_notification', {
        orderId: id,
        userId: session.user.id,
        lineSent: notifyResult.sent,
        reason: notifyResult.reason ?? null,
      });
    }

    if (result.status === 'REJECTED' || result.status === 'EXPIRED') {
      return NextResponse.json(
        {
          success: false,
          orderId: result.orderId,
          status: result.status,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      status: result.status,
      credited: result.credited,
      alreadyCredited: result.alreadyCredited,
      starsGranted: result.starsGranted,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYMENT_ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
    }

    await notifyPaymentAlert({
      title: 'Payment slip submission failed',
      severity: 'warning',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return createErrorResponse(error);
  }
}
