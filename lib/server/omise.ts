/**
 * Omise Client Factory
 *
 * Runtime-safe initialization — never instantiated at build-time.
 * Uses the same factory pattern as getStripeClient() to prevent
 * Next.js SSG crashes when env vars are missing.
 */

import omise from 'omise';

// Derive client type from factory return — no need for separate named import
type OmiseClient = ReturnType<typeof omise>;

let _client: OmiseClient | null = null;

export interface OmiseConfigState {
  ready: boolean;
  reason?: string;
}

function redactKey(key: string): string {
  if (key.length <= 8) {
    return '***';
  }

  return `${key.slice(0, 10)}...${key.slice(-4)}`;
}

function validateOmiseKey(key: string | undefined, prefix: 'skey_' | 'pkey_'): boolean {
  if (!key) {
    return false;
  }

  return key.startsWith(prefix) && key.length > prefix.length + 8;
}

export function getOmiseConfigState(): OmiseConfigState {
  const secretKey = process.env.OMISE_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY;

  if (!validateOmiseKey(secretKey, 'skey_')) {
    return {
      ready: false,
      reason: 'OMISE_SECRET_KEY is missing or invalid format',
    };
  }

  if (!validateOmiseKey(publicKey, 'pkey_')) {
    return {
      ready: false,
      reason: 'NEXT_PUBLIC_OMISE_PUBLIC_KEY is missing or invalid format',
    };
  }

  const mode = (process.env.OMISE_CONFIG_MODE ?? 'test').toLowerCase();
  const expectedSecretPrefix = mode === 'live' ? 'skey_live_' : 'skey_test_';
  const expectedPublicPrefix = mode === 'live' ? 'pkey_live_' : 'pkey_test_';

  if (!secretKey!.startsWith(expectedSecretPrefix)) {
    return {
      ready: false,
      reason: `OMISE_SECRET_KEY does not match OMISE_CONFIG_MODE=${mode}`,
    };
  }

  if (!publicKey!.startsWith(expectedPublicPrefix)) {
    return {
      ready: false,
      reason: `NEXT_PUBLIC_OMISE_PUBLIC_KEY does not match OMISE_CONFIG_MODE=${mode}`,
    };
  }

  return { ready: true };
}

export function getOmiseClient(): OmiseClient | null {
  const state = getOmiseConfigState();
  if (!state.ready) {
    console.warn(`[Omise] ${state.reason}`);
    return null;
  }

  const secretKey = process.env.OMISE_SECRET_KEY!;
  const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY!;
  const mode = (process.env.OMISE_CONFIG_MODE ?? 'test').toLowerCase();

  // Reuse existing instance (connection pooling)
  if (_client) return _client;

  try {
    console.info('[Omise] Initializing client', {
      mode,
      hasSecretKey: Boolean(secretKey),
      hasPublicKey: Boolean(publicKey),
      secretKey: redactKey(secretKey),
      publicKey: redactKey(publicKey),
    });

    _client = omise({
      secretKey,
      publicKey,
    });
    return _client;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to initialize Omise client';
    console.error('[Omise] Client init failed:', message);
    return null;
  }
}

/**
 * Convert THB (baht) to satang (Omise uses smallest currency unit)
 * e.g. 100 THB → 10000 satang
 */
export function toSatang(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert satang back to THB for display
 */
export function fromSatang(satang: number): number {
  return satang / 100;
}
