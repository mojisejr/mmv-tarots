import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { slipVerificationService } from '@/lib/server/services/slip-verification-service';

const STUB_SLIP_FILE = {
  buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
  filename: 'slip.jpg',
  mimeType: 'image/jpeg',
};

describe('slip-verification-service phase2 contract', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.SLIPOK_VERIFY_LOG = 'true';
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
      slipFile: STUB_SLIP_FILE,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('SLIPOK_NOT_CONFIGURED');
    expect(result.errorMessage).toContain('SLIPOK_API_KEY');
    expect(result.errorMessage).toContain('SLIPOK_BRANCH_ID');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses SlipOK multipart files contract with x-authorization and branch path', async () => {
    process.env.SLIPOK_API_BASE_URL = 'https://api.slipok.com';
    process.env.SLIPOK_API_KEY = 'sk_test_123';
    process.env.SLIPOK_BRANCH_ID = 'branch_789';
    process.env.SLIPOK_MAX_RETRIES = '0';
    delete process.env.SLIPOK_API_URL;

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
      slipFile: STUB_SLIP_FILE,
      expectedAmountTHB: 49.75,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.slipok.com/api/line/apikey/branch_789');

    const headers = init.headers as Record<string, string>;
    expect(headers['x-authorization']).toBe('sk_test_123');
    expect(headers['Authorization']).toBeUndefined();
    expect(headers['Content-Type']).toBeUndefined();

    expect(init.body).toBeInstanceOf(FormData);

    const body = init.body as FormData;
    expect(body.get('log')).toBe('true');
    expect(body.get('amount')).toBe('49.75');

    const uploadedFile = body.get('files');
    expect(uploadedFile).toBeInstanceOf(Blob);
    expect((uploadedFile as Blob).type).toBe('image/jpeg');
    expect((uploadedFile as Blob).size).toBe(STUB_SLIP_FILE.buffer.length);
    expect((uploadedFile as Blob & { name?: string }).name).toBe('slip.jpg');

    expect(result.success).toBe(true);
    expect(result.externalRef).toBe('TRX-001');
    expect(result.amountTHB).toBe(49.75);
  });

  it('parses nested success payload with transRef and amount deterministically', async () => {
    process.env.SLIPOK_API_KEY = 'sk_test_abc';
    process.env.SLIPOK_BRANCH_ID = 'branch_nested';
    process.env.SLIPOK_MAX_RETRIES = '0';

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          success: true,
          transRef: 'TRX-NESTED-001',
          amount: '120.50',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await slipVerificationService.verify({
      paymentOrderId: 'pay_nested_001',
      slipFile: STUB_SLIP_FILE,
    });

    expect(result.success).toBe(true);
    expect(result.externalRef).toBe('TRX-NESTED-001');
    expect(result.amountTHB).toBe(120.5);
  });

  it('maps code 1010 to delayed recheck with retry minutes', async () => {
    process.env.SLIPOK_API_KEY = 'sk_test_abc';
    process.env.SLIPOK_BRANCH_ID = 'branch_delay';
    process.env.SLIPOK_MAX_RETRIES = '0';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          code: 1010,
          message: 'กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 7 นาที',
        }),
      })
    );

    const result = await slipVerificationService.verify({
      paymentOrderId: 'pay_delay_001',
      slipFile: STUB_SLIP_FILE,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('1010');
    expect(result.errorCategory).toBe('DELAYED_RECHECK');
    expect(result.retryAfterMinutes).toBe(7);
  });

  it('maps code 1012, 1013, and 1014 to deterministic categories', async () => {
    process.env.SLIPOK_API_KEY = 'sk_test_abc';
    process.env.SLIPOK_BRANCH_ID = 'branch_map';
    process.env.SLIPOK_MAX_RETRIES = '0';

    const payloads = [
      { code: 1012, message: 'สลิปซ้ำ', expected: 'DUPLICATE' },
      { code: 1013, message: 'ยอดที่ส่งมาไม่ตรงกับยอดสลิป', expected: 'AMOUNT_MISMATCH' },
      { code: 1014, message: 'บัญชีผู้รับไม่ตรงกับบัญชีหลักของร้าน', expected: 'RECEIVER_MISMATCH' },
    ] as const;

    for (const payload of payloads) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: vi.fn().mockResolvedValue(payload),
        })
      );

      const result = await slipVerificationService.verify({
        paymentOrderId: `pay_${payload.code}`,
        slipFile: STUB_SLIP_FILE,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(String(payload.code));
      expect(result.errorCategory).toBe(payload.expected);
    }
  });

  it('falls back to JSON url mode when only slipImageUrl is provided', async () => {
    process.env.SLIPOK_API_KEY = 'sk_test_url';
    process.env.SLIPOK_BRANCH_ID = 'branch_url';
    process.env.SLIPOK_MAX_RETRIES = '0';

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          success: true,
          amount: 88,
          transRef: 'TRX-URL-001',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await slipVerificationService.verify({
      paymentOrderId: 'pay_url_001',
      slipImageUrl: 'https://cdn.example/slip-url.jpg',
      expectedAmountTHB: 88,
    });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      url: 'https://cdn.example/slip-url.jpg',
      log: true,
      amount: 88,
    });

    expect(result.success).toBe(true);
  });
});
