import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadingHeader } from '../reading-header';

// Mock dependencies
vi.mock('../../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

describe('ReadingHeader', () => {
  const mockHeader = "การทำนายไพ่ 3 ใบเกี่ยวกับความรัก";

  it('renders reading header when provided', () => {
    render(<ReadingHeader header={mockHeader} />);

    expect(screen.getByText(mockHeader)).toBeInTheDocument();
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('does not render when header is empty', () => {
    const { container } = render(<ReadingHeader header="" />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when header is null', () => {
    const { container } = render(<ReadingHeader header={null as any} />);

    expect(container.firstChild).toBeNull();
  });

  it('applies correct CSS classes for glass morphism effect', () => {
    render(<ReadingHeader header={mockHeader} />);

    const headerElement = screen.getByText(mockHeader);
    expect(headerElement).toHaveClass('text-2xl', 'font-serif', 'text-white');
  });

  it('has proper heading level for accessibility', () => {
    render(<ReadingHeader header={mockHeader} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(mockHeader);
  });
});