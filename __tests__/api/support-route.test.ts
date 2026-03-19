import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { POST } from '@/app/api/support/route';
import { auth } from '@/lib/server/auth';

describe('POST /api/support', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user_001', name: 'Test User', email: 'test@example.com' },
    } as any);

    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = mockFetch as typeof fetch;

    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
  });

  afterEach(() => {
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  it('sends general support ticket to Discord', async () => {
    const request = new Request('http://localhost/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'ต้องการความช่วยเหลือ',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/test',
      expect.objectContaining({
        method: 'POST',
      })
    );

    const sentPayload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentPayload.embeds[0].title).toBe('🎫 New Support Ticket');
  });

  it('sends billing support ticket with enriched embed', async () => {
    const request = new Request('http://localhost/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'ช่วยตรวจสอบรายการนี้หน่อยครับ',
        billing: {
          referenceCode: 'MMV-REF-001',
          status: 'REJECTED',
          packageName: 'Pro Pack',
          amountTHB: 299,
          errorCategory: 'RECEIVER_MISMATCH',
          verificationErrorCode: '1014',
          verificationErrorMessage: 'บัญชีผู้รับไม่ตรงกับบัญชีหลักของร้าน',
          latestLogStatus: 'FAILED',
          latestLogProvider: 'SLIP_OK',
          latestLogAt: '2026-03-19T10:00:00.000Z',
        },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const sentPayload = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentPayload.embeds[0].title).toBe('💳 Billing Support Ticket');
    expect(sentPayload.embeds[0].color).toBe(0xE74C3C);

    const fieldNames = sentPayload.embeds[0].fields.map((f: { name: string }) => f.name);
    expect(fieldNames).toContain('📋 Reference');
    expect(fieldNames).toContain('📦 Package');
    expect(fieldNames).toContain('🔄 Status');
    expect(fieldNames).toContain('⚠️ Error');
    expect(fieldNames).toContain('🔍 Latest Verification');
  });

  it('returns 401 for unauthenticated request', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

    const request = new Request('http://localhost/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'help' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 500 when webhook URL is not configured', async () => {
    delete process.env.DISCORD_WEBHOOK_URL;

    const request = new Request('http://localhost/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'help' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it('returns 400 for empty message', async () => {
    const request = new Request('http://localhost/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
