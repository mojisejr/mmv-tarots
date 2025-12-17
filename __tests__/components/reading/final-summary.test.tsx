import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinalSummary } from '../final-summary';

// Mock dependencies
vi.mock('../../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('../../../components/icons', () => ({
  Star: ({ className }: any) => (
    <div className={className} data-testid="star-icon" />
  ),
}));

describe('FinalSummary', () => {
  const mockSummary = "โดยรวมแล้ว การทำนายไพ่ในครั้งนี้ชี้ให้เห็นว่าคุณกำลังอยู่ในจุดเปลี่ยนของชีวิต การตัดสินใจที่คุณจะทำในช่วงนี้จะส่งผลกระทบต่ออนาคตความรักของคุณอย่างมีนัยสำคัญ";

  it('renders final summary when provided', () => {
    render(<FinalSummary summary={mockSummary} />);

    expect(screen.getByText(mockSummary)).toBeInTheDocument();
  });

  it('does not render when summary is empty', () => {
    const { container } = render(<FinalSummary summary="" />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when summary is null', () => {
    const { container } = render(<FinalSummary summary={null as any} />);

    expect(container.firstChild).toBeNull();
  });

  it('displays section heading with icon', () => {
    render(<FinalSummary summary={mockSummary} />);

    expect(screen.getByText('สรุปผลการทำนาย')).toBeInTheDocument();
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('applies special styling to highlight the summary', () => {
    render(<FinalSummary summary={mockSummary} />);

    const summaryText = screen.getByText(mockSummary);
    expect(summaryText).toHaveClass(
      'text-lg',
      'leading-relaxed',
      'font-serif',
      'italic',
      'text-[#ffffff]'
    );
  });

  it('has proper heading level for accessibility', () => {
    render(<FinalSummary summary={mockSummary} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('สรุปผลการทำนาย');
  });

  it('uses a distinct card background color', () => {
    render(<FinalSummary summary={mockSummary} />);

    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('bg-gradient-to-br', 'from-[var(--color-primary)]/20', 'to-[var(--color-accent)]/20');
  });

  it('shows border accent color', () => {
    render(<FinalSummary summary={mockSummary} />);

    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('border', 'border-[var(--color-primary)]/30');
  });

  it('maintains proper text spacing', () => {
    render(<FinalSummary summary={mockSummary} />);

    const summaryContainer = screen.getByText(mockSummary).parentElement;
    expect(summaryContainer).toHaveClass('prose', 'prose-invert', 'max-w-none');
  });

  it('handles long summaries gracefully', () => {
    const longSummary = mockSummary + ' ' + mockSummary;
    render(<FinalSummary summary={longSummary} />);

    const summaryText = screen.getByText(longSummary);
    expect(summaryText).toHaveClass('whitespace-pre-wrap');
  });
});