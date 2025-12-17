import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistoryPage from '../history/page';

// Mock the GlassCard component
vi.mock('../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  )
}));

// Mock the GlassButton component
vi.mock('../../components/button', () => ({
  GlassButton: ({ children, onClick, disabled, variant, className }: any) => (
    <button
      data-testid="glass-button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  )
}));

// Mock the icons
vi.mock('../../components/icons', () => ({
  Search: ({ className }: any) => <div data-testid="search-icon" className={className} />,
  ChevronRight: ({ className }: any) => <div data-testid="chevron-right-icon" className={className} />
}));

// Mock the useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}));

describe('HistoryPage', () => {
  const mockOnCheckStatus = vi.fn();
  const mockPredictions = [
    {
      id: '8823',
      date: '2m ago',
      query: 'Career path 2024...'
    },
    {
      id: '8821',
      date: '1d ago',
      query: 'Love life advice...'
    },
    {
      id: '8815',
      date: '3d ago',
      query: 'What is my purpose...'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the history page title', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    expect(screen.getByText('Your Journey')).toBeInTheDocument();
  });

  it('renders the search input with placeholder', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const searchInput = screen.getByPlaceholderText('#12345');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('renders the search button', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const searchButton = screen.getByTestId('glass-button');
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toBeDisabled(); // Disabled when input is empty
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('enables search button when input has value', async () => {
    const user = userEvent.setup();
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const searchInput = screen.getByPlaceholderText('#12345');
    const searchButton = screen.getByTestId('glass-button');

    await user.type(searchInput, '12345');

    expect(searchInput).toHaveValue('12345');
    expect(searchButton).not.toBeDisabled();
  });

  it('calls onCheckStatus when search button is clicked', async () => {
    const user = userEvent.setup();
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const searchInput = screen.getByPlaceholderText('#12345');
    const searchButton = screen.getByTestId('glass-button');

    await user.type(searchInput, '12345');
    await user.click(searchButton);

    expect(mockOnCheckStatus).toHaveBeenCalledWith('12345');
  });

  it('calls onCheckStatus when Enter is pressed in search input', async () => {
    const user = userEvent.setup();
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const searchInput = screen.getByPlaceholderText('#12345');

    await user.type(searchInput, '12345{enter}');

    expect(mockOnCheckStatus).toHaveBeenCalledWith('12345');
  });

  it('renders "Recent Visions" heading', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    expect(screen.getByText('Recent Visions')).toBeInTheDocument();
  });

  it('renders all prediction items', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    expect(screen.getByText('Career path 2024...')).toBeInTheDocument();
    expect(screen.getByText('Love life advice...')).toBeInTheDocument();
    expect(screen.getByText('What is my purpose...')).toBeInTheDocument();
  });

  it('displays prediction IDs with hash symbol', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    expect(screen.getByText('#8823')).toBeInTheDocument();
    expect(screen.getByText('#8821')).toBeInTheDocument();
    expect(screen.getByText('#8815')).toBeInTheDocument();
  });

  it('displays dates for each prediction', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    expect(screen.getByText('2m ago')).toBeInTheDocument();
    expect(screen.getByText('1d ago')).toBeInTheDocument();
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });

  it('does not display status (matching template)', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    // Status should NOT be displayed (template doesn't show status)
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Processing')).not.toBeInTheDocument();
  });

  it('renders chevron icons for each prediction', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const chevronIcons = screen.getAllByTestId('chevron-right-icon');
    expect(chevronIcons).toHaveLength(3); // One for each prediction
  });

  it('handles click on prediction item', async () => {
    const user = userEvent.setup();
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const predictionItem = screen.getByText('Career path 2024...').closest('[class*="cursor-pointer"]');
    await user.click(predictionItem!);

    // Should call onCheckStatus with the prediction ID
    expect(mockOnCheckStatus).toHaveBeenCalledWith('8823');
  });

  it('displays empty state when no predictions', () => {
    render(<HistoryPage predictions={[]} onCheckStatus={mockOnCheckStatus} />);

    expect(screen.queryByText('Career path 2024...')).not.toBeInTheDocument();
    expect(screen.getByText('Recent Visions')).toBeInTheDocument();
  });

  it('truncates long query text', () => {
    const longQueryPredictions = [
      {
        id: '8823',
        date: '2m ago',
        status: 'Completed',
        query: 'This is a very long query that should be truncated because it exceeds the container width...'
      }
    ];

    render(<HistoryPage predictions={longQueryPredictions} onCheckStatus={mockOnCheckStatus} />);

    const queryElement = screen.getByText(/This is a very long query/);
    expect(queryElement).toHaveClass('truncate');
  });

  it('adds hover effect to prediction items', () => {
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    // Find prediction items by looking for elements with the hover classes
    const predictionItems = document.querySelectorAll('[class*="cursor-pointer"]');
    expect(predictionItems.length).toBe(3); // Should have 3 prediction items

    predictionItems.forEach(item => {
      expect(item).toHaveClass('group', 'hover:bg-white/10', 'hover:border-white/20');
    });
  });

  it('searches predictions by ID or query text', async () => {
    const user = userEvent.setup();
    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const searchInput = screen.getByPlaceholderText('#12345');

    // Search by ID
    await user.type(searchInput, '8821');
    expect(screen.getByText('Love life advice...')).toBeInTheDocument();
    expect(screen.queryByText('Career path 2024...')).not.toBeInTheDocument();
    expect(screen.queryByText('What is my purpose...')).not.toBeInTheDocument();
  });
});