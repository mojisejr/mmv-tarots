import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PredictionDetailPage from '../page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({ id: 'test-job-id' }),
}));

// Mock components
vi.mock('../../../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../../../../components/button', () => ({
  GlassButton: ({ children, onClick, variant, className }: any) => (
    <button
      data-testid="glass-button"
      data-variant={variant}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../../../components/features/tarot/tarot-card-image', () => ({
  TarotCardImage: ({ card, className }: any) => (
    <div data-testid="tarot-card-image" className={className}>
      <span>{card.displayName || card.name}</span>
    </div>
  ),
}));

vi.mock('../../../../components/icons', () => ({
  ChevronLeft: ({ className }: any) => <div data-testid="chevron-left-icon" className={className} />,
  Loader2: ({ className }: any) => <div data-testid="loader-icon" className={className} />,
  AlertCircle: ({ className }: any) => <div data-testid="alert-icon" className={className} />,
}));

// Mock API
vi.mock('../../../../lib/api', () => ({
  checkJobStatus: vi.fn(),
}));

import { checkJobStatus } from '../../../../lib/api';

const mockCheckJobStatus = checkJobStatus as vi.MockedFunction<typeof checkJobStatus>;

describe('PredictionDetailPage', () => {
  const mockJobId = 'test-job-id';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  const mockPrediction = {
    jobId: mockJobId,
    status: 'COMPLETED',
    question: 'Will I find love in 2024?',
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:05:00Z',
    result: {
      selectedCards: [
        { name: 'The Lovers', image: '/cards/lovers.jpg', position: 'Past' },
        { name: 'The Sun', image: '/cards/sun.jpg', position: 'Present' },
        { name: 'The World', image: '/cards/world.jpg', position: 'Future' },
      ],
      analysis: {
        summary: 'A positive reading about love and fulfillment',
        interpretation: 'The cards indicate...',
      },
      reading: {
        title: 'Your Love Reading',
        content: 'Based on the cards drawn...',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    mockCheckJobStatus.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<PredictionDetailPage />);

    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('displays error state for invalid ID', async () => {
    mockCheckJobStatus.mockRejectedValue(new Error('Prediction not found'));

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('ไม่พบข้อมูลการทำนาย')).toBeInTheDocument();
      expect(screen.getByText('Job ID นี้ไม่ถูกต้องหรือไม่มีในระบบ')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });

  it('renders question correctly when data is loaded', async () => {
    mockCheckJobStatus.mockResolvedValue(mockPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(mockPrediction.question)).toBeInTheDocument();
    });
  });

  it('renders selected cards with images', async () => {
    mockCheckJobStatus.mockResolvedValue(mockPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      const cardImages = screen.getAllByTestId('tarot-card-image');
      expect(cardImages).toHaveLength(3);

      expect(screen.getAllByText('The Lovers')).toHaveLength(2);
      expect(screen.getAllByText('The Sun')).toHaveLength(2);
      expect(screen.getAllByText('The World')).toHaveLength(2);
    });
  });

  it('renders final reading content', async () => {
    mockCheckJobStatus.mockResolvedValue(mockPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Your Love Reading')).toBeInTheDocument();
      expect(screen.getByText('Based on the cards drawn...')).toBeInTheDocument();
    });
  });

  it('has back button that navigates to /history', async () => {
    mockCheckJobStatus.mockResolvedValue(mockPrediction);
    const user = userEvent.setup();

    render(<PredictionDetailPage />);

    await waitFor(() => {
      const backButton = screen.getByText('กลับไปหน้าประวัติ');
      expect(backButton).toBeInTheDocument();
    });

    const backButton = screen.getByText('กลับไปหน้าประวัติ');
    await user.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/history');
  });

  it('formats completion time correctly', async () => {
    mockCheckJobStatus.mockResolvedValue(mockPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(expect.stringContaining('15 มกราคม'))).toBeInTheDocument();
      expect(screen.getByText(expect.stringContaining('17:05'))).toBeInTheDocument();
    });
  });

  it('displays pending state for incomplete predictions', async () => {
    const pendingPrediction = {
      ...mockPrediction,
      status: 'PROCESSING',
      result: undefined,
    };

    mockCheckJobStatus.mockResolvedValue(pendingPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('กำลังทำนาย...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('การทำนายของคุณอยู่ระหว่างดำเนินการ')).toBeInTheDocument();
    });
  });

  it('shows error message for failed predictions', async () => {
    const failedPrediction = {
      ...mockPrediction,
      status: 'FAILED',
      error: {
        code: 'AI_ERROR',
        message: 'Failed to generate reading',
      },
    };

    mockCheckJobStatus.mockResolvedValue(failedPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('การทำนายล้มเหลว')).toBeInTheDocument();
      expect(screen.getByText('Failed to generate reading')).toBeInTheDocument();
    });
  });

  it('auto-refreshes every 5 seconds for pending/processing status', async () => {
    const processingPrediction = {
      ...mockPrediction,
      status: 'PROCESSING',
      result: undefined,
    };

    mockCheckJobStatus
      .mockResolvedValueOnce(processingPrediction)
      .mockResolvedValueOnce(mockPrediction);

    render(<PredictionDetailPage />);

    // Verify processing state
    await waitFor(() => {
      expect(screen.getByText('กำลังทำนาย...')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Fast-forward timers
    vi.advanceTimersByTime(5000);

    // Verify completed state after refresh
    await waitFor(() => {
      expect(screen.getByText(mockPrediction.question)).toBeInTheDocument();
    }, { timeout: 6000 });

    // Should have called API twice
    expect(mockCheckJobStatus).toHaveBeenCalledTimes(2);
  });

  it('stops polling when component unmounts', async () => {
    const processingPrediction = {
      ...mockPrediction,
      status: 'PROCESSING',
      result: undefined,
    };

    mockCheckJobStatus.mockResolvedValue(processingPrediction);

    const { unmount } = render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('กำลังทำนาย...')).toBeInTheDocument();
    });

    unmount();

    // Fast-forward timers
    vi.advanceTimersByTime(5000);

    // Should not have called API again after unmount
    expect(mockCheckJobStatus).toHaveBeenCalledTimes(1);
  });

  it('displays card positions', async () => {
    mockCheckJobStatus.mockResolvedValue(mockPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('อดีต')).toBeInTheDocument();
      expect(screen.getByText('ปัจจุบัน')).toBeInTheDocument();
      expect(screen.getByText('อนาคต')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', async () => {
    mockCheckJobStatus.mockResolvedValue(mockPrediction);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      const backButton = screen.getByText('กลับไปหน้าประวัติ');
      expect(backButton).toHaveAttribute('aria-label', 'กลับไปหน้าประวัติ');
    });
  });
});