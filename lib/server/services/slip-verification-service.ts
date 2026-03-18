import { VerificationProvider } from '@prisma/client';
import type { SlipFileInput } from '@/lib/server/services/payment-fulfillment-service';

export interface VerifySlipInput {
  paymentOrderId: string;
  slipFile?: SlipFileInput;
  slipImageUrl?: string;
  expectedAmountTHB?: number;
}

export interface VerifySlipResult {
  success: boolean;
  provider: VerificationProvider;
  externalRef?: string;
  amountTHB?: number;
  errorCode?: string;
  errorCategory?: SlipVerificationErrorCategory;
  errorMessage?: string;
  retryAfterMinutes?: number;
  raw?: unknown;
}

export type SlipVerificationErrorCategory =
  | 'TEMPORARY'
  | 'DELAYED_RECHECK'
  | 'DUPLICATE'
  | 'AMOUNT_MISMATCH'
  | 'RECEIVER_MISMATCH'
  | 'INVALID';

const DEFAULT_SLIPOK_TIMEOUT_MS = 10000;
const DEFAULT_SLIPOK_MAX_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

interface SlipOkClientConfig {
  endpointUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
  verifyLog: boolean;
}

function roundAmountTHB(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function resolveSlipOkConfig():
  | { ok: true; config: SlipOkClientConfig }
  | { ok: false; missing: string[] } {
  const apiKey = process.env.SLIPOK_API_KEY?.trim();
  const branchId = process.env.SLIPOK_BRANCH_ID?.trim();

  const missing: string[] = [];
  if (!apiKey) {
    missing.push('SLIPOK_API_KEY');
  }
  if (!branchId) {
    missing.push('SLIPOK_BRANCH_ID');
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const resolvedBranchId = branchId as string;
  const resolvedApiKey = apiKey as string;

  const timeoutMs = parseIntEnv(process.env.SLIPOK_TIMEOUT_MS, DEFAULT_SLIPOK_TIMEOUT_MS);
  const maxRetries = parseIntEnv(process.env.SLIPOK_MAX_RETRIES, DEFAULT_SLIPOK_MAX_RETRIES);
  const verifyLog = process.env.SLIPOK_VERIFY_LOG !== 'false';

  const apiUrlOverride = process.env.SLIPOK_API_URL?.trim();
  const baseUrl = (process.env.SLIPOK_API_BASE_URL ?? 'https://api.slipok.com').replace(/\/+$/, '');
  const endpointUrl =
    apiUrlOverride && apiUrlOverride.length > 0
      ? apiUrlOverride
      : `${baseUrl}/api/line/apikey/${encodeURIComponent(resolvedBranchId)}`;

  return {
    ok: true,
    config: {
      endpointUrl,
      apiKey: resolvedApiKey,
      timeoutMs,
      maxRetries,
      verifyLog,
    },
  };
}

function parseAmountTHB(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return roundAmountTHB(value);
  }
  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value.replace(/,/g, ''));
    if (Number.isFinite(normalized)) {
      return roundAmountTHB(normalized);
    }
  }
  return undefined;
}

function buildSlipOkRequest(input: VerifySlipInput, verifyLog: boolean): {
  headers: Record<string, string>;
  body: BodyInit;
} {
  const roundedAmount =
    typeof input.expectedAmountTHB === 'number' && Number.isFinite(input.expectedAmountTHB)
      ? roundAmountTHB(input.expectedAmountTHB)
      : undefined;

  if (input.slipFile) {
    const formData = new FormData();
    const slipArrayBuffer = new ArrayBuffer(input.slipFile.buffer.byteLength);
    new Uint8Array(slipArrayBuffer).set(input.slipFile.buffer);

    const slipBlob = new Blob([slipArrayBuffer], {
      type: input.slipFile.mimeType || 'application/octet-stream',
    });

    formData.append('files', slipBlob, input.slipFile.filename);
    formData.append('log', String(verifyLog));

    if (typeof roundedAmount === 'number') {
      formData.append('amount', String(roundedAmount));
    }

    return {
      headers: {},
      body: formData,
    };
  }

  const requestPayload: Record<string, unknown> = {
    log: verifyLog,
  };

  if (input.slipImageUrl) {
    requestPayload.url = input.slipImageUrl;
  }

  if (typeof roundedAmount === 'number') {
    requestPayload.amount = roundedAmount;
  }

  return {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  };
}

function parseErrorCode(payload: Record<string, unknown>, nestedData: Record<string, unknown> | null): string | undefined {
  const raw = payload.errorCode ?? payload.code ?? nestedData?.errorCode ?? nestedData?.code;
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  return undefined;
}

function parseRetryAfterMinutes(message: string): number | undefined {
  const minuteMatch = message.match(/(\d+)\s*(?:นาที|minute|minutes)/i);
  if (!minuteMatch) {
    return undefined;
  }

  const parsed = Number.parseInt(minuteMatch[1], 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function mapErrorTaxonomy(errorCode: string | undefined, errorMessage: string | undefined): {
  errorCategory: SlipVerificationErrorCategory;
  retryAfterMinutes?: number;
} {
  const normalizedCode = errorCode?.trim();

  if (normalizedCode === '1009') {
    return {
      errorCategory: 'TEMPORARY',
      retryAfterMinutes: 15,
    };
  }

  if (normalizedCode === '1010') {
    return {
      errorCategory: 'DELAYED_RECHECK',
      retryAfterMinutes: errorMessage ? parseRetryAfterMinutes(errorMessage) ?? 15 : 15,
    };
  }

  if (normalizedCode === '1012') {
    return {
      errorCategory: 'DUPLICATE',
    };
  }

  if (normalizedCode === '1013') {
    return {
      errorCategory: 'AMOUNT_MISMATCH',
    };
  }

  if (normalizedCode === '1014') {
    return {
      errorCategory: 'RECEIVER_MISMATCH',
    };
  }

  return {
    errorCategory: 'INVALID',
  };
}

function extractExternalRef(payload: Record<string, unknown>): string | undefined {
  const direct = payload.transactionId ?? payload.transRef ?? payload.reference;
  if (typeof direct === 'string' && direct.length > 0) {
    return direct;
  }

  const data = payload.data;
  if (typeof data === 'object' && data !== null) {
    const nestedPayload = data as Record<string, unknown>;
    const nested = nestedPayload.transactionId ?? nestedPayload.transRef;
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
  const nestedData =
    typeof data.data === 'object' && data.data !== null ? (data.data as Record<string, unknown>) : null;

  const successRaw = nestedData?.success ?? data.success ?? data.ok ?? data.valid;
  const success = successRaw === true || successRaw === 'true' || successRaw === 1;

  const amountRaw = nestedData?.amount ?? data.amountTHB ?? data.amount ?? data.amount_thb;
  const amountTHB = parseAmountTHB(amountRaw);

  const errorCode = parseErrorCode(data, nestedData);

  const errorMessage =
    typeof data.errorMessage === 'string'
      ? data.errorMessage
      : typeof data.message === 'string'
        ? data.message
        : typeof nestedData?.message === 'string'
          ? nestedData.message
        : undefined;

  const { errorCategory, retryAfterMinutes } = mapErrorTaxonomy(errorCode, errorMessage);

  return {
    success,
    provider,
    externalRef: extractExternalRef(data),
    amountTHB,
    errorCode,
    errorCategory,
    errorMessage,
    retryAfterMinutes,
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
    const configResult = resolveSlipOkConfig();

    if (!configResult.ok) {
      return {
        success: false,
        provider: VerificationProvider.SLIP_OK,
        errorCode: 'SLIPOK_NOT_CONFIGURED',
        errorMessage: `Missing required SlipOK configuration: ${configResult.missing.join(', ')}`,
      };
    }

    const { endpointUrl, apiKey, timeoutMs, maxRetries, verifyLog } = configResult.config;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const request = buildSlipOkRequest(input, verifyLog);

        const response = await fetchWithTimeout(
          endpointUrl,
          {
            method: 'POST',
            headers: {
              'x-authorization': apiKey,
              ...request.headers,
            },
            body: request.body,
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
