import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
const mockSetCurrentPage = vi.fn();

let sessionState: { data: { user: { id: string; name: string } } | null; isPending: boolean } = {
  data: { user: { id: 'user_billing_123', name: 'Billing User' } },
  isPending: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/client/auth-client', () => ({
  useSession: () => sessionState,
}));

vi.mock('@/lib/client/providers/navigation-provider', () => ({
  useNavigation: () => ({
    setCurrentPage: mockSetCurrentPage,
  }),
}));

describe('Billing Page Phase 4', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSetCurrentPage.mockReset();
    sessionState = {
      data: { user: { id: 'user_billing_123', name: 'Billing User' } },
      isPending: false,
    };
  });

  it('shows billing rows for authenticated user', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'order_1',
                referenceCode: 'MMV-001',
                status: 'CREDITED',
                amountTHB: 199,
                createdAt: '2026-03-17T10:00:00.000Z',
                verifiedAt: '2026-03-17T10:05:00.000Z',
                creditedAt: '2026-03-17T10:06:00.000Z',
                verificationErrorCode: null,
                verificationErrorMessage: null,
                package: {
                  id: 'pkg_1',
                  name: 'Starter Pack',
                  stars: 99,
                },
              },
            ],
            pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
          },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const module = await import('../../app/billing/page');
    const BillingPage = module.default;

    render(<BillingPage />);

    await waitFor(() => {
      expect(mockSetCurrentPage).toHaveBeenCalledWith('billing');
    });

    await waitFor(() => {
      expect(screen.getByText('Starter Pack')).toBeTruthy();
      expect(screen.getAllByText('เครดิตเข้าแล้ว').length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no billing rows are returned', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
          },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const module = await import('../../app/billing/page');
    const BillingPage = module.default;

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีประวัติการเติมเครดิต')).toBeTruthy();
    });
  });

  it('redirects unauthorized user to home', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;
    sessionState = { data: null, isPending: false };

    const module = await import('../../app/billing/page');
    const BillingPage = module.default;

    render(<BillingPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});