/**
 * Minimal TypeScript declarations for the `omise` npm package (v1.x)
 * https://github.com/omise/omise-node
 *
 * No official @types/omise package exists — declaring what we use.
 */

declare module 'omise' {
  export interface OmiseConfig {
    publicKey?: string;
    secretKey?: string;
    omiseVersion?: string;
  }

  export interface OmiseAmount {
    amount: number;
    currency: string;
  }

  // ── Source (PromptPay) ──────────────────────────────────────────────────────
  export interface OmiseScannableCode {
    type: string;
    image: {
      id: string;
      livemode: boolean;
      location: string;
      object: string;
      filename: string;
      kind: string;
      mime_type: string;
      download_uri: string;
    };
  }

  export interface OmiseSource {
    object: 'source';
    id: string;
    livemode: boolean;
    type: string;
    amount: number;
    currency: string;
    flow: string;
    scannable_code?: OmiseScannableCode;
    mobile_number?: string;
    phone_number?: string;
  }

  export interface OmiseSourceCreateParams {
    type: 'promptpay' | 'internet_banking_bay' | 'mobile_banking_scb' | string;
    amount: number;
    currency: string;
    phone_number?: string;
    name?: string;
    email?: string;
  }

  // ── Charge ──────────────────────────────────────────────────────────────────
  export type OmiseChargeStatus = 'pending' | 'successful' | 'failed' | 'reversed' | 'expired';

  export interface OmiseCharge {
    object: 'charge';
    id: string;
    livemode: boolean;
    status: OmiseChargeStatus;
    amount: number;
    currency: string;
    description?: string;
    capture: boolean;
    authorized: boolean;
    reversed: boolean;
    paid: boolean;
    refunded: number;
    failure_code?: string;
    failure_message?: string;
    authorize_uri?: string;
    return_uri?: string;
    source?: OmiseSource;
    card?: {
      id: string;
      financing: string;
      brand: string;
      last_digits: string;
    };
    metadata: Record<string, string>;
    created_at: string;
    expires_at?: string;
  }

  export interface OmiseChargeCreateParams {
    amount: number;
    currency: string;
    card?: string;
    source?: string;
    description?: string;
    return_uri?: string;
    metadata?: Record<string, string>;
    capture?: boolean;
  }

  // ── Client ──────────────────────────────────────────────────────────────────
  export interface OmiseSources {
    create(params: OmiseSourceCreateParams): Promise<OmiseSource>;
    retrieve(id: string): Promise<OmiseSource>;
  }

  export interface OmiseCharges {
    create(params: OmiseChargeCreateParams): Promise<OmiseCharge>;
    retrieve(id: string): Promise<OmiseCharge>;
  }

  export interface OmiseClient {
    sources: OmiseSources;
    charges: OmiseCharges;
  }

  // Factory function
  function omise(config: OmiseConfig): OmiseClient;
  export = omise;
}

// ── Omise.js Browser API (CDN) ──────────────────────────────────────────────
declare interface OmiseCardTokenData {
  name: string;
  number: string;
  expiration_month: number | string;
  expiration_year: number | string;
  security_code: string;
}

declare interface OmiseTokenObject {
  id: string;
  object: 'token';
  card: {
    id: string;
    last_digits: string;
    brand: string;
    expiration_month: number;
    expiration_year: number;
  };
}

declare interface OmiseTokenResponse {
  code: 'OK' | string;
  message?: string;
  object?: OmiseTokenObject;
}

declare interface OmiseJsBrowser {
  setPublicKey(key: string): void;
  createToken(
    type: 'card',
    cardData: OmiseCardTokenData,
    callback: (statusCode: number, response: OmiseTokenResponse) => void,
  ): void;
}

declare interface Window {
  Omise: OmiseJsBrowser | undefined;
  OmiseCard: unknown; // Omise hosted fields — not used (we use custom form)
}
