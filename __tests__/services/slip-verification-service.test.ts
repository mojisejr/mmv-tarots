import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { slipVerificationService } from '@/lib/server/services/slip-verification-service';

describe('slip-verification-service phase1 contract', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns deterministic configuration error when required env is missing', async () => {
    delete process.env.SLIPOK_API_KEY;
    delete process.env.SLIPOK_BRANCH_ID;

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await slipVerificationService.verify({
      paymentOrderId: 'pay_001',
      slipImageUrl: 'https://cdn.example/slip.jpg',
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('SLIPOK_NOT_CONFIGURED');
    expect(result.errorMessage).toContain('SLIPOK_API_KEY');
    expect(result.errorMessage).toContain('SLIPOK_BRANCH_ID');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses SlipOK URL mode contract with x-authorization and branch path', async () => {
    process.env.SLIPOK_API_BASE_URL = 'https://api.slipok.com';
    process.env.SLIPOK_API_KEY = 'sk_test_123';
    process.env.SLIPOK_BRANCH_ID = 'branch_789';
    process.env.SLIPOK_MAX_RETRIES = '0';

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          success: true,
          amount: 49.75,
          transRef: 'TRX-001',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await slipVerificationService.verify({
      paymentOrderId: 'pay_002',
      slipImageUrl: 'https://cdn.example/slip-2.jpg',
      expectedAmountTHB: 49.75,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.slipok.com/api/line/apikey/branch_789');

    const headers = init.headers as Record<string, string>;
    expect(headers['x-authorization']).toBe('sk_test_123');
    expect(headers['Authorization']).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      url: 'https://cdn.example/slip-2.jpg',
      log: true,
      amount: 49.75,
    });

    expect(result.success).toBe(true);
    expect(result.externalRef).toBe('TRX-001');
    expect(result.amountTHB).toBe(49.75);
  });
});
