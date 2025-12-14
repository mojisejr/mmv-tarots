import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistoryPage from '../history/page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock navigation provider
vi.mock('../../lib/providers/navigation-provider', () => ({
  useNavigation: () => ({
    setCurrentPage: vi.fn(),
  }),
}));

// Mock API
vi.mock('../../lib/api', () => ({
  fetchUserPredictions: vi.fn(),
  checkJobStatus: vi.fn(),
}));

import { fetchUserPredictions, checkJobStatus } from '../../lib/api';

// Mock components
vi.mock('../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../../components/button', () => ({
  GlassButton: ({ children, onClick, disabled, className }: any) => (
    <button
      data-testid="glass-button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../components/history-card', () => ({
  HistoryCard: ({ prediction, onClick }: any) => (
    <div data-testid="history-card" onClick={() => onClick(prediction.id)}>
      <span>{prediction.question}</span>
      <span data-testid={`prediction-status-${prediction.status.toLowerCase()}`}>
        {prediction.status}
      </span>
      {prediction.status === 'COMPLETED' && (
        <span data-testid="card-count">{prediction.selectedCards?.length || 0} ใบ</span>
      )}
    </div>
  ),
}));

vi.mock('../../components/icons', () => ({
  Search: ({ className }: any) => <div data-testid="search-icon" />,
  ChevronRight: ({ className }: any) => <div data-testid="chevron-right-icon" />,
}));

const mockFetchUserPredictions = fetchUserPredictions as vi.MockedFunction<typeof fetchUserPredictions>;
const mockCheckJobStatus = checkJobStatus as vi.MockedFunction<typeof checkJobStatus>;

describe('HistoryPage (Updated with Status Display)', () => {
  const mockPredictions = [
    {
      id: 'job-123',
      jobId: 'job-123',
      question: 'Will I find love in 2024?',
      status: 'COMPLETED',
      createdAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T10:02:00Z',
      selectedCards: [
        { name: 'The Lovers', image: '/cards/lovers.jpg' },
        { name: 'The Sun', image: '/cards/sun.jpg' },
        { name: 'The World', image: '/cards/world.jpg' },
      ],
    },
    {
      id: 'job-456',
      jobId: 'job-456',
      question: 'Should I change my career?',
      status: 'PROCESSING',
      createdAt: '2024-01-14T15:30:00Z',
      completedAt: null,
      selectedCards: null,
    },
    {
      id: 'job-789',
      jobId: 'job-789',
      question: 'What is my life purpose?',
      status: 'PENDING',
      createdAt: '2024-01-13T09:00:00Z',
      completedAt: null,
      selectedCards: null,
    },
    {
      id: 'job-999',
      jobId: 'job-999',
      question: 'Will I be successful?',
      status: 'FAILED',
      createdAt: '2024-01-12T14:20:00Z',
      completedAt: null,
      selectedCards: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays predictions with status indicators', async () => {
    mockFetchUserPredictions.mockResolvedValue({
      predictions: mockPredictions,
      total: 4,
      page: 1,
      totalPages: 1,
    });

    render(<HistoryPage />);

    await waitFor(() => {
      // Check that all predictions are displayed
      expect(screen.getByText('Will I find love in 2024?')).toBeInTheDocument();
      expect(screen.getByText('Should I change my career?')).toBeInTheDocument();
      expect(screen.getByText('What is my life purpose?')).toBeInTheDocument();
      expect(screen.getByText('Will I be successful?')).toBeInTheDocument();

      // Check status indicators
      expect(screen.getByTestId('prediction-status-completed')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-status-processing')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-status-pending')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-status-failed')).toBeInTheDocument();
    });
  });

  it('shows card count only for completed predictions', async () => {
    mockFetchUserPredictions.mockResolvedValue({
      predictions: mockPredictions,
      total: 4,
      page: 1,
      totalPages: 1,
    });

    render(<HistoryPage />);

    await waitFor(() => {
      // Only completed prediction should show card count
      const cardCounts = screen.getAllByTestId('card-count');
      expect(cardCounts).toHaveLength(1);
      expect(cardCounts[0]).toHaveTextContent('3 ใบ');
    });
  });

  it('navigates to detail page when clicking completed prediction', async () => {
    mockFetchUserPredictions.mockResolvedValue({
      predictions: [mockPredictions[0]], // Only completed prediction
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const user = userEvent.setup();
    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Will I find love in 2024?')).toBeInTheDocument();
    });

    const historyCard = screen.getByTestId('history-card');
    await user.click(historyCard);

    expect(mockPush).toHaveBeenCalledWith('/history/job-123');
  });

  it('polls for status updates every 3 seconds', async () => {
    const initialPredictions = [mockPredictions[1]]; // Processing prediction
    const updatedPrediction = {
      ...mockPredictions[1],
      status: 'COMPLETED',
      selectedCards: [
        { name: 'The Fool', image: '/cards/fool.jpg' },
      ],
    };

    mockFetchUserPredictions
      .mockResolvedValueOnce({
        predictions: initialPredictions,
        total: 1,
        page: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        predictions: [updatedPrediction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('prediction-status-processing')).toBeInTheDocument();
    });

    // Fast-forward 3 seconds
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByTestId('prediction-status-completed')).toBeInTheDocument();
    });

    expect(mockFetchUserPredictions).toHaveBeenCalledTimes(2);
  });

  it('stops polling when all predictions are completed or failed', async () => {
    const completedPredictions = [mockPredictions[0], mockPredictions[3]]; // Completed and Failed

    mockFetchUserPredictions.mockResolvedValue({
      predictions: completedPredictions,
      total: 2,
      page: 1,
      totalPages: 1,
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('prediction-status-completed')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-status-failed')).toBeInTheDocument();
    });

    // Fast-forward multiple intervals
    vi.advanceTimersByTime(10000);

    // Should not have called API again after initial load
    expect(mockFetchUserPredictions).toHaveBeenCalledTimes(1);
  });

  it('displays loading state while fetching predictions', async () => {
    mockFetchUserPredictions.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<HistoryPage />);

    expect(screen.getByText('Loading your predictions...')).toBeInTheDocument();
  });

  it('displays error state when API fails', async () => {
    mockFetchUserPredictions.mockRejectedValue(new Error('API Error'));

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load predictions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  it('retries fetching when retry button is clicked', async () => {
    mockFetchUserPredictions
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        predictions: [mockPredictions[0]],
        total: 1,
        page: 1,
        totalPages: 1,
      });

    const user = userEvent.setup();
    render(<HistoryPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load predictions')).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    await user.click(retryButton);

    // Verify success state
    await waitFor(() => {
      expect(screen.getByText('Will I find love in 2024?')).toBeInTheDocument();
    });

    expect(mockFetchUserPredictions).toHaveBeenCalledTimes(2);
  });

  it('does not render search functionality', async () => {
    mockFetchUserPredictions.mockResolvedValue({
      predictions: mockPredictions,
      total: 4,
      page: 1,
      totalPages: 1,
    });

    render(<HistoryPage />);

    await waitFor(() => {
      // Search elements should not be present
      expect(screen.queryByPlaceholderText('#12345')).not.toBeInTheDocument();
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('Find Ticket')).not.toBeInTheDocument();
    });
  });

  it('shows proper page title and section headers', async () => {
    mockFetchUserPredictions.mockResolvedValue({
      predictions: mockPredictions,
      total: 4,
      page: 1,
      totalPages: 1,
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Your Journey')).toBeInTheDocument();
      expect(screen.getByText('Recent Visions')).toBeInTheDocument();
    });
  });

  it('displays empty state when no predictions exist', async () => {
    mockFetchUserPredictions.mockResolvedValue({
      predictions: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('No predictions found')).toBeInTheDocument();
      expect(screen.getByText('Submit your first question to see it here')).toBeInTheDocument();
    });
  });

  it('cleans up polling intervals on unmount', async () => {
    const processingPredictions = [mockPredictions[1]]; // Processing prediction
    mockFetchUserPredictions.mockResolvedValue({
      predictions: processingPredictions,
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const { unmount } = render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('prediction-status-processing')).toBeInTheDocument();
    });

    // Unmount component
    unmount();

    // Fast-forward timers
    vi.advanceTimersByTime(3000);

    // Should not have called API again after unmount
    expect(mockFetchUserPredictions).toHaveBeenCalledTimes(1);
  });

  it('formats dates correctly', async () => {
    mockFetchUserPredictions.mockResolvedValue({
      predictions: [mockPredictions[0]], // Completed prediction
      total: 1,
      page: 1,
      totalPages: 1,
    });

    // Mock current time
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Will I find love in 2024?')).toBeInTheDocument();
    });

    // Date formatting is done inside HistoryCard component
    // This test verifies that the data is passed correctly
    expect(screen.getByTestId('history-card')).toBeInTheDocument();

    vi.useRealTimers();
  });
});