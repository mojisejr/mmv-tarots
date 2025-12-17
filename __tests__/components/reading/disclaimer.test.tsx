import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Disclaimer } from '../disclaimer';

// Mock dependencies
vi.mock('../../../components/icons', () => ({
  Info: ({ className }: any) => (
    <div className={className} data-testid="info-icon" />
  ),
}));

describe('Disclaimer', () => {
  const mockDisclaimer = "การทำนายไพ่ทาโรต์เป็นเพียงคำแนะนำเชิงสัญลักษณ์ ไม่ควรใช้เป็นข้อมูลอ้างอิงในการตัดสินใจที่สำคัญในชีวิต โปรดใช้วิจารณญาณในการพิจารณาข้อมูล";

  it('renders disclaimer text when provided', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    expect(screen.getByText(mockDisclaimer)).toBeInTheDocument();
  });

  it('does not render when text is empty', () => {
    const { container } = render(<Disclaimer text="" />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when text is null', () => {
    const { container } = render(<Disclaimer text={null as any} />);

    expect(container.firstChild).toBeNull();
  });

  it('displays info icon', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
  });

  it('applies muted text styling', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    const disclaimerText = screen.getByText(mockDisclaimer);
    expect(disclaimerText).toHaveClass(
      'text-xs',
      'text-[#ffffff66]',
      'leading-relaxed'
    );
  });

  it('shows proper spacing between icon and text', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    const container = screen.getByTestId('disclaimer-container');
    expect(container).toHaveClass('flex', 'items-start', 'gap-2');
  });

  it('has icon with correct size and color', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    const icon = screen.getByTestId('info-icon');
    expect(icon).toHaveClass('w-4', 'h-4', 'text-[#ffffff66]', 'mt-0.5');
  });

  it('wraps text correctly', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    const disclaimerText = screen.getByText(mockDisclaimer);
    expect(disclaimerText).toHaveClass('text-xs', 'text-[#ffffff66]', 'leading-relaxed');
  });

  it('has proper margin from previous elements', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    const container = screen.getByTestId('disclaimer-container');
    expect(container).toHaveClass('mt-8');
  });

  it('handles long disclaimer text gracefully', () => {
    const longDisclaimer = mockDisclaimer + " " + mockDisclaimer;
    render(<Disclaimer text={longDisclaimer} />);

    const disclaimerText = screen.getByText(longDisclaimer);
    expect(disclaimerText).toBeInTheDocument();
    expect(disclaimerText).toHaveClass('leading-relaxed');
  });

  it('is accessible with proper role', () => {
    render(<Disclaimer text={mockDisclaimer} />);

    const container = screen.getByTestId('disclaimer-container');
    expect(container).toHaveAttribute('role', 'note');
  });
});