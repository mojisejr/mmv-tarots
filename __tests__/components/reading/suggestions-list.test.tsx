import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionsList } from '../suggestions-list';

// Mock dependencies
vi.mock('../../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('../../../components/icons', () => ({
  Lightbulb: ({ className }: any) => (
    <div className={className} data-testid="lightbulb-icon" />
  ),
}));

describe('SuggestionsList', () => {
  const mockSuggestions = [
    'สร้างความสัมพันธ์ที่ดีขึ้นกับคนรอบข้าง',
    'ให้เวลากับตัวเองในการตัดสินใจ',
    'เปิดใจรับฟังความคิดเห็นของผู้อื่น',
  ];

  it('renders suggestions when provided', () => {
    render(<SuggestionsList suggestions={mockSuggestions} />);

    mockSuggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('does not render when suggestions array is empty', () => {
    const { container } = render(<SuggestionsList suggestions={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when suggestions is null', () => {
    const { container } = render(<SuggestionsList suggestions={null as any} />);

    expect(container.firstChild).toBeNull();
  });

  it('displays section heading', () => {
    render(<SuggestionsList suggestions={mockSuggestions} />);

    expect(screen.getByText('คำแนะนำ')).toBeInTheDocument();
    expect(screen.getByTestId('lightbulb-icon')).toBeInTheDocument();
  });

  it('renders each suggestion as a list item', () => {
    render(<SuggestionsList suggestions={mockSuggestions} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(mockSuggestions.length);
  });

  it('applies correct CSS classes to suggestion items', () => {
    render(<SuggestionsList suggestions={mockSuggestions} />);

    const listItems = screen.getAllByRole('listitem');
    listItems.forEach(item => {
      expect(item).toHaveClass(
        'flex',
        'items-start',
        'gap-3',
        'text-[#ffffffcc]',
        'leading-relaxed'
      );
    });
  });

  it('has proper heading level for accessibility', () => {
    render(<SuggestionsList suggestions={mockSuggestions} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('คำแนะนำ');
  });

  it('renders list with proper accessibility attributes', () => {
    render(<SuggestionsList suggestions={mockSuggestions} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('space-y-3');
  });

  it('shows bullet points for each suggestion', () => {
    render(<SuggestionsList suggestions={mockSuggestions} />);

    const bullets = screen.getAllByTestId('suggestion-bullet');
    expect(bullets).toHaveLength(mockSuggestions.length);

    bullets.forEach(bullet => {
      expect(bullet).toHaveClass(
        'w-2',
        'h-2',
        'rounded-full',
        'bg-[var(--color-primary)]',
        'mt-2',
        'flex-shrink-0'
      );
    });
  });
});