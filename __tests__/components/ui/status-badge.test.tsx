import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders pending status with yellow color and icon', () => {
    render(<StatusBadge status="PENDING" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-yellow-500/20');
    expect(badge).toHaveClass('text-yellow-300');
    expect(badge).toHaveClass('border-yellow-500/30');

    expect(screen.getByText('รอคิว...')).toBeInTheDocument();
    expect(screen.getByTestId('status-icon-pending')).toBeInTheDocument();
  });

  it('renders processing status with blue color and icon', () => {
    render(<StatusBadge status="PROCESSING" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-blue-500/20');
    expect(badge).toHaveClass('text-blue-300');
    expect(badge).toHaveClass('border-blue-500/30');

    expect(screen.getByText('กำลังทำนาย...')).toBeInTheDocument();
    expect(screen.getByTestId('status-icon-processing')).toBeInTheDocument();
  });

  it('renders completed status with green color and icon', () => {
    render(<StatusBadge status="COMPLETED" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-green-500/20');
    expect(badge).toHaveClass('text-green-300');
    expect(badge).toHaveClass('border-green-500/30');

    expect(screen.getByText('ทำนายเสร็จแล้ว')).toBeInTheDocument();
    expect(screen.getByTestId('status-icon-completed')).toBeInTheDocument();
  });

  it('renders failed status with red color and icon', () => {
    render(<StatusBadge status="FAILED" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-red-500/20');
    expect(badge).toHaveClass('text-red-300');
    expect(badge).toHaveClass('border-red-500/30');

    expect(screen.getByText('ไม่สามารถทำนายได้')).toBeInTheDocument();
    expect(screen.getByTestId('status-icon-failed')).toBeInTheDocument();
  });

  it('displays correct Thai message for each status', () => {
    const statuses = [
      { status: 'PENDING', message: 'รอคิว...' },
      { status: 'PROCESSING', message: 'กำลังทำนาย...' },
      { status: 'COMPLETED', message: 'ทำนายเสร็จแล้ว' },
      { status: 'FAILED', message: 'ไม่สามารถทำนายได้' }
    ];

    statuses.forEach(({ status, message }) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<StatusBadge status="PROCESSING" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label', 'สถานะ: กำลังทำนาย...');
  });
});