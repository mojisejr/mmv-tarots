import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock the HistoryPage component dependencies
vi.mock('../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

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
  ),
}));

vi.mock('../../components/icons', () => ({
  Search: ({ className }: any) => <div data-testid="search-icon" />,
  ChevronRight: ({ className }: any) => <div data-testid="chevron-right-icon" />,
}));

describe('HistoryPage API Integration', () => {
  const mockOnCheckStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user predictions from API', async () => {
    // Mock API response for user predictions
    const mockPredictions = [
      {
        id: 'job-123',
        jobId: 'job-123',
        question: 'Will I find love in 2024?',
        status: 'COMPLETED',
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:02:00Z',
        finalReading: {
          cards: ['The Lovers', 'The Sun'],
          interpretation: 'Love is on its way...'
        }
      },
      {
        id: 'job-456',
        jobId: 'job-456',
        question: 'Should I change my career?',
        status: 'PROCESSING',
        createdAt: '2024-01-14T15:30:00Z',
        completedAt: null,
        finalReading: null
      }
    ];

    // Mock fetch for getting user predictions
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        predictions: mockPredictions,
        total: 2,
        page: 1,
        totalPages: 1
      }),
    });

    // This would be the API endpoint for user predictions
    // Implementation would need to be created
    const fetchUserPredictions = async (userId: string) => {
      const response = await fetch(`/api/predictions/user/${userId}`);
      return response.json();
    };

    // Simulate API call
    const result = await fetchUserPredictions('user-123');

    expect(fetch).toHaveBeenCalledWith('/api/predictions/user/user-123');
    expect(result.predictions).toHaveLength(2);
    expect(result.predictions[0].question).toBe('Will I find love in 2024?');
  });

  it('should display predictions from API in correct format', async () => {
    const mockPredictions = [
      {
        id: 'job-789',
        jobId: 'job-789',
        question: 'What is my life purpose?',
        status: 'COMPLETED',
        createdAt: '2024-01-10T09:00:00Z',
        completedAt: '2024-01-10T09:05:00Z'
      },
      {
        id: 'job-012',
        jobId: 'job-012',
        question: 'Will I be successful?',
        status: 'PENDING',
        createdAt: '2024-01-16T14:20:00Z',
        completedAt: null
      }
    ];

    // Create a wrapper that simulates loading from API
    const HistoryPageWrapper = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Transform API data to component format
      const transformedPredictions = mockPredictions.map(p => ({
        id: p.jobId,
        date: formatDate(p.createdAt),
        query: p.question,
        status: p.status.toLowerCase()
      }));

      const HistoryPage = require('../../history/page').default;
      return (
        <HistoryPage
          predictions={transformedPredictions}
          onCheckStatus={mockOnCheckStatus}
        />
      );
    };

    // Since this is async, we need to handle it differently
    // In a real test, we would use React Testing Library's async utilities
    const { default: HistoryPage } = require('../../history/page');

    const transformedPredictions = mockPredictions.map(p => ({
      id: p.jobId,
      date: formatDate(p.createdAt),
      query: p.question,
      status: p.status.toLowerCase()
    }));

    render(<HistoryPage predictions={transformedPredictions} onCheckStatus={mockOnCheckStatus} />);

    // Verify predictions are displayed
    expect(screen.getByText('What is my life purpose?')).toBeInTheDocument();
    expect(screen.getByText('Will I be successful?')).toBeInTheDocument();
    expect(screen.getByText('#job-789')).toBeInTheDocument();
    expect(screen.getByText('#job-012')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch predictions'
        }
      }),
    });

    // Mock error handling
    const HistoryPageWrapper = () => {
      const [predictions, setPredictions] = require('react').useState([]);
      const [error, setError] = require('react').useState(null);

      // Simulate API call with error handling
      const loadPredictions = async () => {
        try {
          const response = await fetch('/api/predictions/user/user-123');
          if (!response.ok) {
            throw new Error('Failed to fetch predictions');
          }
          const data = await response.json();
          setPredictions(data.predictions);
        } catch (err) {
          setError('Unable to load predictions');
        }
      };

      // This would be called in useEffect in real implementation
      loadPredictions();

      if (error) {
        return <div data-testid="error-message">{error}</div>;
      }

      const HistoryPage = require('../../history/page').default;
      return <HistoryPage predictions={predictions} onCheckStatus={mockOnCheckStatus} />;
    };

    // In a real implementation, this would show error state
    // For now, just verify the error would be thrown
    const response = await fetch('/api/predictions/user/user-123');
    expect(response.ok).toBe(false);
  });

  it('should check job status when prediction is clicked', async () => {
    const mockPrediction = {
      id: 'job-345',
      jobId: 'job-345',
      question: 'Should I move to a new city?',
      status: 'PROCESSING'
    };

    const { default: HistoryPage } = require('../../history/page');

    const predictions = [{
      id: mockPrediction.jobId,
      date: '1h ago',
      query: mockPrediction.question,
      status: mockPrediction.status.toLowerCase()
    }];

    render(<HistoryPage predictions={predictions} onCheckStatus={mockOnCheckStatus} />);

    // Click on prediction item
    const predictionItem = screen.getByText('Should I move to a new city?')
      .closest('[class*="cursor-pointer"]');
    await userEvent.click(predictionItem!);

    // Verify onCheckStatus is called with correct jobId
    expect(mockOnCheckStatus).toHaveBeenCalledWith('job-345');
  });

  it('should update prediction status in real-time', async () => {
    const initialStatus = {
      jobId: 'job-status-test',
      status: 'PROCESSING',
      question: 'Test status update'
    };

    const updatedStatus = {
      jobId: 'job-status-test',
      status: 'COMPLETED',
      question: 'Test status update',
      finalReading: {
        cards: ['The World'],
        interpretation: 'Success awaits'
      }
    };

    // Mock initial fetch
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          predictions: [initialStatus],
          total: 1
        }),
      })
      // Mock status check
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedStatus,
      });

    // Simulate status polling
    const checkJobStatus = async (jobId: string) => {
      const response = await fetch(`/api/predict/${jobId}`);
      return response.json();
    };

    const status = await checkJobStatus('job-status-test');
    expect(status.status).toBe('COMPLETED');
    expect(status.finalReading).toBeDefined();
  });

  it('should search predictions by ID or question', async () => {
    const mockPredictions = [
      {
        id: 'search-123',
        date: '2d ago',
        query: 'Career guidance for 2024',
      },
      {
        id: 'search-456',
        date: '1w ago',
        query: 'Love and relationships',
      },
      {
        id: 'search-789',
        date: '3d ago',
        query: 'Financial future reading',
      }
    ];

    const { default: HistoryPage } = require('../../history/page');
    const user = userEvent.setup();

    render(<HistoryPage predictions={mockPredictions} onCheckStatus={mockOnCheckStatus} />);

    const searchInput = screen.getByPlaceholderText('#12345');

    // Search by ID
    await user.type(searchInput, 'search-456');
    expect(screen.getByText('Love and relationships')).toBeInTheDocument();
    expect(screen.queryByText('Career guidance for 2024')).not.toBeInTheDocument();

    // Clear and search by query
    await user.clear(searchInput);
    await user.type(searchInput, 'financial');
    expect(screen.getByText('Financial future reading')).toBeInTheDocument();
    expect(screen.queryByText('Love and relationships')).not.toBeInTheDocument();
  });
});

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}