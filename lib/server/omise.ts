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

export function getOmiseClient(): OmiseClient | null {
  const secretKey = process.env.OMISE_SECRET_KEY;

  if (!secretKey) {
    console.warn('[Omise] OMISE_SECRET_KEY is not configured');
    return null;
  }

  // Reuse existing instance (connection pooling)
  if (_client) return _client;

  _client = omise({ secretKey });
  return _client;
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
