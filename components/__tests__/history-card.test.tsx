import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HistoryCard } from '../history-card';

// Mock StatusBadge component
vi.mock('../status-badge', () => ({
  StatusBadge: ({ status }: { status: string }) => (
    <div data-testid={`status-badge-${status.toLowerCase()}`}>{status}</div>
  ),
}));

// Mock icons
vi.mock('../icons', () => ({
  ChevronRight: ({ className }: any) => <div data-testid="chevron-icon" className={className} />,
  Eye: ({ className }: any) => <div data-testid="eye-icon" className={className} />,
}));

describe('HistoryCard', () => {
  const mockOnClick = vi.fn();
  const mockPrediction = {
    id: 'job-123',
    question: 'Will I find love in 2024?',
    status: 'COMPLETED',
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:02:00Z',
    selectedCards: [
      { name: 'The Lovers', image: '/cards/lovers.jpg' },
      { name: 'The Sun', image: '/cards/sun.jpg' },
      { name: 'The World', image: '/cards/world.jpg' },
    ],
  };

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders question prominently', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    const question = screen.getByText(mockPrediction.question);
    expect(question).toBeInTheDocument();
    expect(question).toHaveClass('text-white');
  });

  it('shows correct status indicator with StatusBadge', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    expect(screen.getByTestId('status-badge-completed')).toBeInTheDocument();
  });

  it('shows Job ID and formatted time', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    expect(screen.getByText(`#${mockPrediction.id}`)).toBeInTheDocument();
    // Time formatting will be tested with the utility function
  });

  it('shows correct layout structure matching template', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    const question = screen.getByText(mockPrediction.question);
    expect(question).toHaveClass('text-white', 'font-medium', 'truncate', 'text-base', 'mb-1');

    const jobId = screen.getByText(`#${mockPrediction.id}`);
    expect(jobId).toBeInTheDocument();
    expect(jobId.parentElement).toHaveClass('text-xs', 'text-white/40', 'font-mono');
  });

  it('truncates long questions correctly', () => {
    const longQuestion = 'A'.repeat(200);
    const longPrediction = { ...mockPrediction, question: longQuestion };

    render(<HistoryCard prediction={longPrediction} onClick={mockOnClick} />);

    const questionElement = screen.getByText(longQuestion);
    expect(questionElement).toHaveClass('truncate');
  });

  it('handles onClick callback when clicking the card', async () => {
    const user = userEvent.setup();
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    const card = screen.getByTestId('history-card');
    await user.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(mockPrediction.id);
  });

  
  it('displays chevron icon for navigation', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
  });

  it('applies hover effects', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    const card = screen.getByTestId('history-card');
    expect(card).toHaveClass('hover:bg-white/10');
    expect(card).toHaveClass('hover:border-white/20');
  });

  it('has proper accessibility attributes', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    const card = screen.getByTestId('history-card');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining(mockPrediction.question));
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    const card = screen.getByTestId('history-card');
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockOnClick).toHaveBeenCalledWith(mockPrediction.id);
  });

  it('uses correct CSS variables for hover effects', () => {
    render(<HistoryCard prediction={mockPrediction} onClick={mockOnClick} />);

    const question = screen.getByText(mockPrediction.question);
    // Check that the question uses the correct CSS variable (color-primary, not primary)
    expect(question).toHaveClass('group-hover:text-[var(--color-primary)]');
  });
});