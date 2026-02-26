import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { PaymentReceipt } from '../../../components/features/payment/PaymentReceipt';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/components', () => ({
  GlassButton: ({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) => (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('PaymentReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes modal and redirects to question input page when CTA is clicked', () => {
    expect.assertions(2);

    const onClose = vi.fn();

    render(
      <PaymentReceipt
        chargeId="chrg_test_123"
        packageName="Starter Pack"
        stars={50}
        amount={99}
        method="CARD"
        paidAt={new Date('2026-02-26T14:00:00.000Z')}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /ไปดูดวงเลย/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
