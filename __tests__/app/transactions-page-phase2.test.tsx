import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
const mockSetCurrentPage = vi.fn();

let sessionState: { data: { user: { id: string; name: string } } | null; isPending: boolean } = {
  data: { user: { id: 'user_tx_123', name: 'TX User' } },
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

describe('Transactions Page Phase 2', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSetCurrentPage.mockReset();
    sessionState = {
      data: { user: { id: 'user_tx_123', name: 'TX User' } },
      isPending: false,
    };
  });

  it('shows transactions list for authenticated user', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          transactions: [
            {
              id: 'tx_1',
              amount: 99,
              balanceAfter: 199,
              type: 'TOPUP',
              status: 'SUCCESS',
              createdAt: '2026-03-17T10:00:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
        { status: 200 }
      );
    }) as any;

    const module = await import('../../app/transactions/page');
    const TransactionsPage = module.default;

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(mockSetCurrentPage).toHaveBeenCalledWith('transactions');
    });

    await waitFor(() => {
      expect(screen.getByText('เติมดาว (Package)')).toBeTruthy();
    });
  });

  it('shows empty state when no transactions are returned', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          transactions: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }),
        { status: 200 }
      );
    }) as any;

    const module = await import('../../app/transactions/page');
    const TransactionsPage = module.default;

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('ไม่พบประวัติการทำรายการ')).toBeTruthy();
    });
  });

  it('redirects unauthorized user to home', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })) as any;
    sessionState = { data: null, isPending: false };

    const module = await import('../../app/transactions/page');
    const TransactionsPage = module.default;

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});