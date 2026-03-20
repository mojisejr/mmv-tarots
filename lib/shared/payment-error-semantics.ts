export type PaymentErrorCategory =
  | 'TEMPORARY'
  | 'DELAYED_RECHECK'
  | 'DUPLICATE'
  | 'AMOUNT_MISMATCH'
  | 'RECEIVER_MISMATCH'
  | 'INVALID'
  | 'UNKNOWN';

export interface PaymentErrorSemantics {
  errorCategory: PaymentErrorCategory;
  retryAfterMinutes: number | null;
  delayMinutes: number | null;
}

function parseDelayMinutes(message: string | null | undefined): number | null {
  if (!message) {
    return null;
  }

  const minuteMatch = message.match(/(\d+)\s*(?:นาที|minute|minutes)/i);
  if (!minuteMatch) {
    return null;
  }

  const minutes = Number.parseInt(minuteMatch[1], 10);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }

  return minutes;
}

export function mapPaymentErrorSemantics(input: {
  verificationErrorCode?: string | null;
  verificationErrorMessage?: string | null;
}): PaymentErrorSemantics {
  const rawCode = input.verificationErrorCode?.trim();
  const code = rawCode && rawCode.length > 0 ? rawCode : null;

  if (!code) {
    return {
      errorCategory: 'UNKNOWN',
      retryAfterMinutes: null,
      delayMinutes: null,
    };
  }

  if (code === '1009') {
    return {
      errorCategory: 'TEMPORARY',
      retryAfterMinutes: 15,
      delayMinutes: null,
    };
  }

  if (code === '1010') {
    const delay = parseDelayMinutes(input.verificationErrorMessage) ?? 15;
    return {
      errorCategory: 'DELAYED_RECHECK',
      retryAfterMinutes: delay,
      delayMinutes: delay,
    };
  }

  if (code === '1012') {
    return {
      errorCategory: 'DUPLICATE',
      retryAfterMinutes: null,
      delayMinutes: null,
    };
  }

  if (code === '1013') {
    return {
      errorCategory: 'AMOUNT_MISMATCH',
      retryAfterMinutes: null,
      delayMinutes: null,
    };
  }

  if (code === '1014') {
    return {
      errorCategory: 'RECEIVER_MISMATCH',
      retryAfterMinutes: null,
      delayMinutes: null,
    };
  }

  return {
    errorCategory: 'INVALID',
    retryAfterMinutes: null,
    delayMinutes: null,
  };
}