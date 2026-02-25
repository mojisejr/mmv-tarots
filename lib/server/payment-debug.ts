type DebugPayload = Record<string, unknown>;

function isPaymentDebugEnabled(): boolean {
  return process.env.PAYMENT_DEBUG === '1' || process.env.PAYMENT_DEBUG === 'true';
}

export function paymentDebug(scope: string, message: string, payload?: DebugPayload): void {
  if (!isPaymentDebugEnabled()) {
    return;
  }

  const timestamp = new Date().toISOString();
  if (payload) {
    console.log(`[PaymentDebug][${timestamp}][${scope}] ${message}`, payload);
    return;
  }

  console.log(`[PaymentDebug][${timestamp}][${scope}] ${message}`);
}
