import * as Sentry from '@sentry/nextjs';

type EventPayload = Record<string, unknown>;

function asError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage =
      (error as { message?: unknown }).message ??
      (error as { error?: { message?: unknown } }).error?.message;
    const maybeCode =
      (error as { code?: unknown }).code ??
      (error as { error?: { code?: unknown } }).error?.code;

    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
      const err = new Error(maybeMessage);
      if (typeof maybeCode === 'string') {
        err.name = maybeCode;
      }
      return err;
    }
  }

  return new Error(typeof error === 'string' ? error : 'Unknown error');
}

function stringifyPayload(payload: EventPayload): string {
  try {
    return JSON.stringify(payload);
  } catch {
    return '{"serialization":"failed"}';
  }
}

export function emitPaymentEvent(event: string, payload: EventPayload): void {
  const timestamp = new Date().toISOString();
  console.info(`[PaymentEvent] ${event} ${timestamp} ${stringifyPayload(payload)}`);
}

export function emitDeliveryProof(payload: {
  jobId: string;
  userId?: string | null;
  predictionId?: string | null;
  completedAt?: string | null;
}): void {
  const timestamp = new Date().toISOString();
  console.info(
    `[DeliveryProof] prediction.delivered ${timestamp} ${stringifyPayload({
      jobId: payload.jobId,
      userId: payload.userId ?? null,
      predictionId: payload.predictionId ?? null,
      completedAt: payload.completedAt ?? null,
      deliveredAt: timestamp,
    })}`
  );
}

export function capturePaymentException(
  operation: string,
  error: unknown,
  context: EventPayload = {}
): void {
  const normalizedError = asError(error);

  Sentry.withScope((scope) => {
    scope.setTag('domain', 'payment');
    scope.setTag('operation', operation);

    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined) {
        scope.setExtra(key, value);
      }
    }

    Sentry.captureException(normalizedError);
  });

  emitPaymentEvent('payment.exception', {
    operation,
    message: normalizedError.message,
    ...context,
  });
}

export async function notifyPaymentAlert(params: {
  title: string;
  severity?: 'info' | 'warning' | 'critical';
  details: EventPayload;
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  const colorMap: Record<'info' | 'warning' | 'critical', number> = {
    info: 0x5865f2,
    warning: 0xf39c12,
    critical: 0xe74c3c,
  };

  const severity = params.severity ?? 'warning';
  const fields = Object.entries(params.details)
    .filter(([, value]) => value !== undefined)
    .slice(0, 12)
    .map(([name, value]) => ({
      name,
      value: String(value ?? 'null'),
      inline: true,
    }));

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'MMV Payment Guard',
        embeds: [
          {
            title: params.title,
            color: colorMap[severity],
            timestamp: new Date().toISOString(),
            fields,
          },
        ],
      }),
    });
  } catch (error: unknown) {
    const normalizedError = asError(error);
    console.error('[PaymentAlert] Discord notification failed:', normalizedError.message);
  }
}