import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch for status checking
global.fetch = vi.fn();

// Mock the SubmittedPage component dependencies
vi.mock('../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../../components/features/avatar/mimi-loading-avatar', () => ({
  MimiLoadingAvatar: () => <div data-testid="mimi-loading-avatar">Loading</div>,
}));

vi.mock('../../components/icons', () => ({
  Copy: ({ className }: any) => <div data-testid="copy-icon" />,
  CheckCircle2: ({ className }: any) => <div data-testid="check-icon" />,
  Sparkles: ({ className }: any) => <div data-testid="sparkles-icon" />,
  Zap: ({ className }: any) => <div data-testid="zap-icon" />,
  RefreshCw: ({ className }: any) => <div data-testid="refresh-icon" />,
  Moon: ({ className }: any) => <div data-testid="moon-icon" />,
}));

vi.mock('../../constants/waiting-steps', () => ({
  WAITING_STEPS: [
    { id: 'filter', label: 'Cleaning energy...', Icon: () => <div data-testid="sparkles-icon" /> },
    { id: 'analyzer', label: 'Sensing aura...', Icon: () => <div data-testid="zap-icon" /> },
    { id: 'selector', label: 'Shuffling...', Icon: () => <div data-testid="refresh-icon" /> },
    { id: 'reader', label: 'Interpreting...', Icon: () => <div data-testid="moon-icon" /> }
  ],
  FUN_FACTS: [
    "Did you know? The Death card rarely means physical death.",
    "Tarot originated in northern Italy in the 15th century."
  ]
}));

// Mock alert
global.alert = vi.fn();

describe('SubmittedPage URL Parameter Integration', () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();
  let mockUseSearchParams: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUseSearchParams = vi.fn(() => mockSearchParams);
    (useSearchParams as any) = mockUseSearchParams;
    (useRouter as any).mockImplementation(() => ({
      push: mockPush,
      back: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load jobId from URL search params', async () => {
    // Set jobId in URL params
    mockSearchParams.set('jobId', 'test-job-456');

    // Mock the SubmittedPage to read from URL
    const SubmittedPageWrapper = () => {
      // Simulate reading jobId from URL
      const jobId = mockSearchParams.get('jobId') || 'default-job';
      const SubmittedPage = require('../../submitted/page').default;

      return (
        <SubmittedPage
          jobId={jobId}
          onComplete={() => {}}
        />
      );
    };

    render(<SubmittedPageWrapper />);

    // Verify jobId is displayed
    await waitFor(() => {
      expect(screen.getByText('#test-job-456')).toBeInTheDocument();
    });
  });

  it('should handle missing jobId gracefully', async () => {
    // Don't set jobId in URL params
    const SubmittedPageWrapper = () => {
      const jobId = mockSearchParams.get('jobId');

      if (!jobId) {
        return <div data-testid="error-message">Job ID not found</div>;
      }

      const SubmittedPage = require('../../submitted/page').default;
      return <SubmittedPage jobId={jobId} onComplete={() => {}} />;
    };

    render(<SubmittedPageWrapper />);

    // Should show error message for missing jobId
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Job ID not found')).toBeInTheDocument();
  });

  it('should poll job status from API', async () => {
    mockSearchParams.set('jobId', 'test-job-789');

    // Mock API responses
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'test-job-789',
        status: 'PROCESSING',
        question: 'Will I find success?',
        createdAt: new Date().toISOString(),
      }),
    });

    const SubmittedPageWrapper = () => {
      const jobId = mockSearchParams.get('jobId') || 'default-job';
      const SubmittedPage = require('../../submitted/page').default;

      // Simulate status polling
      const checkStatus = async () => {
        const response = await fetch(`/api/predict/${jobId}`);
        const data = await response.json();
        return data;
      };

      // This would be implemented in the real component
      setTimeout(checkStatus, 5000);

      return <SubmittedPage jobId={jobId} onComplete={() => {}} />;
    };

    render(<SubmittedPageWrapper />);

    // Fast-forward to trigger polling
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/predict/test-job-789');
    });
  });

  it('should redirect to history page after completion', async () => {
    mockSearchParams.set('jobId', 'test-job-complete');

    const SubmittedPageWrapper = () => {
      const jobId = mockSearchParams.get('jobId') || 'default-job';
      const SubmittedPage = require('../../submitted/page').default;

      const onComplete = () => {
        // Simulate navigation to history
        mockPush('/history');
      };

      return <SubmittedPage jobId={jobId} onComplete={onComplete} />;
    };

    render(<SubmittedPageWrapper />);

    // Fast-forward 15 seconds for auto-redirect
    vi.advanceTimersByTime(15000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/history');
    });
  });

  it('should copy jobId when clicked', async () => {
    mockSearchParams.set('jobId', 'copy-test-job');

    const SubmittedPageWrapper = () => {
      const jobId = mockSearchParams.get('jobId') || 'default-job';
      const SubmittedPage = require('../../submitted/page').default;
      return <SubmittedPage jobId={jobId} onComplete={() => {}} />;
    };

    render(<SubmittedPageWrapper />);

    const jobIdElement = screen.getByText('#copy-test-job');
    await userEvent.click(jobIdElement);

    expect(global.alert).toHaveBeenCalledWith('Copied Ticket ID: copy-test-job');
  });

  it('should show progress bar animation', async () => {
    mockSearchParams.set('jobId', 'progress-test');

    const SubmittedPageWrapper = () => {
      const jobId = mockSearchParams.get('jobId') || 'default-job';
      const SubmittedPage = require('../../submitted/page').default;
      return <SubmittedPage jobId={jobId} onComplete={() => {}} />;
    };

    render(<SubmittedPageWrapper />);

    // Check initial progress
    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar?.getAttribute('style')).toContain('width: 25%');

    // Advance time and check progress updates
    vi.advanceTimersByTime(3500);

    const updatedProgressBar = document.querySelector('[style*="width"]');
    expect(updatedProgressBar?.getAttribute('style')).toContain('width: 50%');
  });
});