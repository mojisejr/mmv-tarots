import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextQuestions } from '../next-questions';

// Mock dependencies
vi.mock('../../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('../../../components/icons', () => ({
  HelpCircle: ({ className }: any) => (
    <div className={className} data-testid="help-circle-icon" />
  ),
}));

describe('NextQuestions', () => {
  const mockQuestions = [
    'ความสัมพันธ์นี้เหมาะกับฉันหรือไม่?',
    'ฉันควรตัดสินใจอย่างไรในเรื่องงาน?',
    'อุปสรรคที่กำลังจะมาถึงคืออะไร?',
  ];

  it('renders next questions when provided', () => {
    render(<NextQuestions questions={mockQuestions} />);

    mockQuestions.forEach(question => {
      expect(screen.getByText(question)).toBeInTheDocument();
    });
  });

  it('does not render when questions array is empty', () => {
    const { container } = render(<NextQuestions questions={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when questions is null', () => {
    const { container } = render(<NextQuestions questions={null as any} />);

    expect(container.firstChild).toBeNull();
  });

  it('displays section heading', () => {
    render(<NextQuestions questions={mockQuestions} />);

    expect(screen.getByText('คำถามสำหรับความคิดต่อ')).toBeInTheDocument();
    expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument();
  });

  it('renders each question as a list item', () => {
    render(<NextQuestions questions={mockQuestions} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(mockQuestions.length);
  });

  it('applies correct CSS classes to question items', () => {
    render(<NextQuestions questions={mockQuestions} />);

    const listItems = screen.getAllByRole('listitem');
    listItems.forEach(item => {
      expect(item).toHaveClass(
        'text-[#ffffffdd]',
        'italic',
        'leading-relaxed',
        'pl-6',
        'border-l-2',
        'border-[#ffffff33]'
      );
    });
  });

  it('has proper heading level for accessibility', () => {
    render(<NextQuestions questions={mockQuestions} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('คำถามสำหรับความคิดต่อ');
  });

  it('renders list with proper accessibility attributes', () => {
    render(<NextQuestions questions={mockQuestions} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('space-y-2', 'mt-4');
  });

  it('shows intro text before questions', () => {
    render(<NextQuestions questions={mockQuestions} />);

    expect(screen.getByText('คำถามที่ควรพิจารณาต่อไป:')).toBeInTheDocument();
  });

  it('applies hover effect to question items', () => {
    render(<NextQuestions questions={mockQuestions} />);

    const listItems = screen.getAllByRole('listitem');
    listItems.forEach(item => {
      expect(item).toHaveClass('hover:border-[var(--color-primary)]', 'transition-colors');
    });
  });
});