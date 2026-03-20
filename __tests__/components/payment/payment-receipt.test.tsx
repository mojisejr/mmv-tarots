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

  it('closes modal and redirects to default path when primary CTA is clicked', () => {
    expect.assertions(2);

    const onClose = vi.fn();

    render(
      <PaymentReceipt
        transactionRef="PAY-REF-001"
        packageName="Starter Pack"
        stars={50}
        amount={99}
        paidAt={new Date('2026-02-26T14:00:00.000Z')}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /ดูดวง/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to returnTo path when provided', () => {
    expect.assertions(2);

    const onClose = vi.fn();

    render(
      <PaymentReceipt
        transactionRef="PAY-REF-002"
        packageName="Pro Pack"
        stars={100}
        amount={299}
        paidAt={new Date('2026-02-26T14:00:00.000Z')}
        onClose={onClose}
        returnTo="/question/abc"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /ดำเนินการ/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/question/abc');
  });

  it('displays secondary CTA for billing', () => {
    const onClose = vi.fn();

    render(
      <PaymentReceipt
        transactionRef="PAY-REF-003"
        packageName="Starter Pack"
        stars={50}
        amount={99}
        paidAt={new Date('2026-02-26T14:00:00.000Z')}
        onClose={onClose}
      />
    );

    const billingButton = screen.getByRole('button', { name: /รายการชำระเงิน/i });
    fireEvent.click(billingButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/billing');
  });

  it('shows stars and package name in receipt', () => {
    render(
      <PaymentReceipt
        transactionRef="PAY-REF-004"
        packageName="Star Pack"
        stars={25}
        amount={149}
        paidAt={new Date('2026-02-26T14:00:00.000Z')}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Star Pack')).toBeDefined();
    expect(screen.getByText('+25 ดวง')).toBeDefined();
    expect(screen.getByText('฿149')).toBeDefined();
  });

  it('shows reference code with reduced prominence', () => {
    render(
      <PaymentReceipt
        transactionRef="PAY-REF-005"
        packageName="Starter Pack"
        stars={50}
        amount={99}
        paidAt={new Date('2026-02-26T14:00:00.000Z')}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/PAY-REF-005/)).toBeDefined();
  });
});
