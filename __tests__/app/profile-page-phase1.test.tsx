import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
const mockSetCurrentPage = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/client/auth-client', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user_test_1234567890',
        name: 'Test User',
        image: null,
      },
    },
    isPending: false,
  }),
}));

vi.mock('@/lib/client/providers/navigation-provider', () => ({
  useNavigation: () => ({
    setCurrentPage: mockSetCurrentPage,
  }),
}));

vi.mock('@/lib/client/liff-environment', () => ({
  isLiffEnvironment: () => false,
}));

vi.mock('@/components', () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  GlassButton: ({ children, ...props }: any) => (
    <button type="button" {...props}>{children}</button>
  ),
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (
    isOpen ? <div>{children}</div> : null
  ),
}));

describe('Profile Page Phase 1 IA', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSetCurrentPage.mockReset();

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/credits/balance')) {
        return new Response(JSON.stringify({ stars: 42 }), { status: 200 });
      }

      if (url.includes('/api/user/me')) {
        return new Response(
          JSON.stringify({ referralCode: 'ABC123', referredById: null }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({}), { status: 200 });
    }) as any;
  });

  it('removes legacy profile tabs and shows account hub links', async () => {
    const module = await import('../../app/profile/page');
    const ProfilePage = module.default;

    render(<ProfilePage />);

    await waitFor(() => {
      expect(mockSetCurrentPage).toHaveBeenCalledWith('profile');
    });

    expect(screen.queryByRole('button', { name: 'Predictions' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Transactions' })).toBeNull();
    expect(screen.queryByText('Recent Predictions')).toBeNull();

    expect(screen.getByText('Prediction History')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Transactions/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Billing/i })).toBeTruthy();
  });
});
