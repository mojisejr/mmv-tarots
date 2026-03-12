import { VerificationProvider } from '@prisma/client';

export interface VerifySlipInput {
  paymentOrderId: string;
  slipImageUrl: string;
}

export interface VerifySlipResult {
  success: boolean;
  provider: VerificationProvider;
  externalRef?: string;
  amountTHB?: number;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
}

const DEFAULT_SLIPOK_TIMEOUT_MS = 10000;
const DEFAULT_SLIPOK_MAX_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function parseAmountTHB(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * 100) / 100;
  }
  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value.replace(/,/g, ''));
    if (Number.isFinite(normalized)) {
      return Math.round(normalized * 100) / 100;
    }
  }
  return undefined;
}

function extractExternalRef(payload: Record<string, unknown>): string | undefined {
  const direct = payload.transactionId ?? payload.transRef ?? payload.reference;
  if (typeof direct === 'string' && direct.length > 0) {
    return direct;
  }

  const data = payload.data;
  if (typeof data === 'object' && data !== null) {
    const nested = (data as Record<string, unknown>).transactionId;
    if (typeof nested === 'string' && nested.length > 0) {
      return nested;
    }
  }

  return undefined;
}

function normalizeVerifyResponse(payload: unknown): VerifySlipResult {
  const provider = VerificationProvider.SLIP_OK;

  if (typeof payload !== 'object' || payload === null) {
    return {
      success: false,
      provider,
      errorCode: 'INVALID_PROVIDER_RESPONSE',
      errorMessage: 'SlipOK returned an invalid response payload.',
      raw: payload,
    };
  }

  const data = payload as Record<string, unknown>;
  const successRaw = data.success ?? data.ok ?? data.valid;
  const success = successRaw === true || successRaw === 'true' || successRaw === 1;

  const amountRaw = data.amountTHB ?? data.amount ?? data.amount_thb;
  const amountTHB = parseAmountTHB(amountRaw);

  const errorCode =
    typeof data.errorCode === 'string'
      ? data.errorCode
      : typeof data.code === 'string'
        ? data.code
        : undefined;

  const errorMessage =
    typeof data.errorMessage === 'string'
      ? data.errorMessage
      : typeof data.message === 'string'
        ? data.message
        : undefined;

  return {
    success,
    provider,
    externalRef: extractExternalRef(data),
    amountTHB,
    errorCode,
    errorMessage,
    raw: payload,
  };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export const slipVerificationService = {
  async verify(input: VerifySlipInput): Promise<VerifySlipResult> {
    const apiUrl = process.env.SLIPOK_API_URL ?? 'https://api.slipok.com/api/v1/verify';
    const apiKey = process.env.SLIPOK_API_KEY;
    const timeoutMs = Number.parseInt(
      process.env.SLIPOK_TIMEOUT_MS ?? String(DEFAULT_SLIPOK_TIMEOUT_MS),
      10
    );
    const maxRetries = Number.parseInt(
      process.env.SLIPOK_MAX_RETRIES ?? String(DEFAULT_SLIPOK_MAX_RETRIES),
      10
    );

    if (!apiKey) {
      return {
        success: false,
        provider: VerificationProvider.SLIP_OK,
        errorCode: 'SLIPOK_NOT_CONFIGURED',
        errorMessage: 'Missing SLIPOK_API_KEY in environment configuration.',
      };
    }

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await fetchWithTimeout(
          apiUrl,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'X-Payment-Order-Id': input.paymentOrderId,
            },
            body: JSON.stringify({
              paymentOrderId: input.paymentOrderId,
              slipImageUrl: input.slipImageUrl,
            }),
          },
          timeoutMs
        );

        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch {
          payload = { message: 'Provider returned non-JSON response' };
        }

        if (!response.ok) {
          if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
            continue;
          }

          const normalized = normalizeVerifyResponse(payload);
          return {
            ...normalized,
            success: false,
            errorCode: normalized.errorCode ?? `HTTP_${response.status}`,
            errorMessage:
              normalized.errorMessage ?? `SlipOK verification request failed (${response.status}).`,
          };
        }

        const normalized = normalizeVerifyResponse(payload);
        if (normalized.success) {
          return normalized;
        }

        return {
          ...normalized,
          success: false,
          errorCode: normalized.errorCode ?? 'SLIP_INVALID',
          errorMessage: normalized.errorMessage ?? 'Slip verification failed.',
        };
      } catch (error) {
        if (attempt < maxRetries) {
          continue;
        }

        const message = error instanceof Error ? error.message : 'Unknown network error';
        return {
          success: false,
          provider: VerificationProvider.SLIP_OK,
          errorCode: 'SLIPOK_NETWORK_ERROR',
          errorMessage: message,
        };
      }
    }

    return {
      success: false,
      provider: VerificationProvider.SLIP_OK,
      errorCode: 'SLIPOK_RETRY_EXHAUSTED',
      errorMessage: 'Slip verification failed after retry attempts.',
    };
  },
};
