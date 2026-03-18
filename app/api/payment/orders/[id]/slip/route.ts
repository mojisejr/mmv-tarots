import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { ApiError, ERROR_CODES, createErrorResponse } from '@/lib/server/errors';
import { emitPaymentEvent, notifyPaymentAlert } from '@/lib/server/payment-observability';
import { lineOaNotificationService } from '@/lib/server/services/line-oa-notification-service';
import { paymentFulfillmentService } from '@/lib/server/services/payment-fulfillment-service';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.jfif']);

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
}

function isValidSlipFile(file: Blob & { name?: string }): { valid: true } | { valid: false; reason: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: `ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)` };
  }

  const mimeValid = ALLOWED_MIME_TYPES.has(file.type.toLowerCase());
  const filename = file.name ?? '';
  const extValid = ALLOWED_EXTENSIONS.has(getFileExtension(filename));

  if (!mimeValid && !extValid) {
    return { valid: false, reason: 'รองรับเฉพาะไฟล์ภาพ JPG, PNG, WEBP เท่านั้น' };
  }

  return { valid: true };
}

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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Request must be multipart/form-data with a slip image file',
      });
    }

    const file = formData.get('slipFile');
    if (!file || typeof file === 'string') {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'กรุณาแนบไฟล์รูปสลิปการโอน (field: slipFile)',
      });
    }

    const slipBlob = file as Blob & { name?: string };

    const validation = isValidSlipFile(slipBlob);
    if (!validation.valid) {
      throw new ApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: validation.reason,
      });
    }

    const buffer = Buffer.from(await slipBlob.arrayBuffer());

    const result = await paymentFulfillmentService.submitSlip({
      orderId: id,
      userId: session.user.id,
      slipFile: {
        buffer,
        filename: slipBlob.name ?? 'slip.jpg',
        mimeType: slipBlob.type || 'image/jpeg',
      },
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
