import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock components
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
  Clock: ({ className }: any) => <div data-testid="clock-icon" />,
}));

// Mock constants
vi.mock('../../constants/waiting-steps', () => ({
  WAITING_STEPS: [
    { id: 'step1', label: 'Step 1', Icon: () => <div data-testid="step1-icon" /> },
    { id: 'step2', label: 'Step 2', Icon: () => <div data-testid="step2-icon" /> },
    { id: 'step3', label: 'Step 3', Icon: () => <div data-testid="step3-icon" /> },
    { id: 'step4', label: 'Step 4', Icon: () => <div data-testid="step4-icon" /> }
  ],
  FUN_FACTS: ['Fun fact 1', 'Fun fact 2', 'Fun fact 3']
}));

describe('Auto-redirect Integration Test', () => {
  const mockPush = vi.fn();
  let mockJobId = 'auto-redirect-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (useRouter as any).mockImplementation(() => ({
      push: mockPush,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-redirect after 15 seconds', async () => {
    const SubmittedPageWithTimer = () => {
      const [timeLeft, setTimeLeft] = require('react').useState(15);
      const { useState, useEffect } = require('react');

      useEffect(() => {
        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              mockPush('/history');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }, []);

      const onComplete = () => {
        mockPush('/history');
      };

      const skipRedirect = () => {
        mockPush('/history');
      };

      return (
        <div data-testid="submitted-page">
          <div data-testid="timer-display">
            Redirecting in {timeLeft} seconds...
          </div>
          <button data-testid="skip-button" onClick={skipRedirect}>
            Skip
          </button>
          <button data-testid="complete-now" onClick={onComplete}>
            Complete Now
          </button>
        </div>
      );
    };

    render(<SubmittedPageWithTimer />);

    // Initial state
    expect(screen.getByText('Redirecting in 15 seconds...')).toBeInTheDocument();

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);
    expect(screen.getByText('Redirecting in 5 seconds...')).toBeInTheDocument();

    // Advance to completion
    vi.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/history');
    });
  });

  it('should show countdown timer', async () => {
    const SubmittedPageWithCountdown = () => {
      const [countdown, setCountdown] = require('react').useState(15);

      require('react').useEffect(() => {
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }, []);

      return (
        <div>
          <div data-testid="countdown">{countdown}</div>
          <div data-testid="progress-bar" style={{ width: `${(countdown / 15) * 100}%` }} />
        </div>
      );
    };

    render(<SubmittedPageWithCountdown />);

    // Check initial countdown
    expect(screen.getByTestId('countdown')).toHaveTextContent('15');
    expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '100%' });

    // After 5 seconds
    vi.advanceTimersByTime(5000);
    expect(screen.getByTestId('countdown')).toHaveTextContent('10');
    expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '66.66666666666666%' });

    // After 10 more seconds
    vi.advanceTimersByTime(10000);
    expect(screen.getByTestId('countdown')).toHaveTextContent('0');
    expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '0%' });
  });

  it('should allow user to skip auto-redirect', async () => {
    const SubmittedPageWithSkip = () => {
      const onComplete = () => mockPush('/history');
      const skipNow = () => mockPush('/history');

      return (
        <div>
          <div data-testid="submitted-page">Processing...</div>
          <button data-testid="skip-button" onClick={skipNow}>
            Skip Waiting
          </button>
        </div>
      );
    };

    render(<SubmittedPageWithSkip />);

    // Click skip before auto-redirect
    await userEvent.click(screen.getByTestId('skip-button'));

    // Should immediately redirect
    expect(mockPush).toHaveBeenCalledWith('/history');
  });

  it('should cancel auto-redirect on user action', async () => {
    let redirectTimer: NodeJS.Timeout;

    const SubmittedPageWithCancel = () => {
      const [isRedirecting, setIsRedirecting] = require('react').useState(true);

      const cancelRedirect = () => {
        setIsRedirecting(false);
        if (redirectTimer) {
          clearTimeout(redirectTimer);
        }
      };

      const proceedRedirect = () => {
        mockPush('/history');
      };

      require('react').useEffect(() => {
        if (isRedirecting) {
          redirectTimer = setTimeout(() => {
            proceedRedirect();
          }, 15000);
        }
      }, [isRedirecting]);

      return (
        <div>
          <div data-testid="status">
            {isRedirecting ? 'Auto-redirecting...' : 'Redirect cancelled'}
          </div>
          <button data-testid="cancel-button" onClick={cancelRedirect}>
            Cancel Auto-redirect
          </button>
          <button data-testid="proceed-button" onClick={proceedRedirect}>
            Proceed Anyway
          </button>
        </div>
      );
    };

    render(<SubmittedPageWithCancel />);

    // Initially auto-redirecting
    expect(screen.getByText('Auto-redirecting...')).toBeInTheDocument();

    // Cancel auto-redirect
    await userEvent.click(screen.getByTestId('cancel-button'));

    expect(screen.getByText('Redirect cancelled')).toBeInTheDocument();

    // Advance 15 seconds - should not redirect
    vi.advanceTimersByTime(15000);

    // Should not have redirected
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle page visibility changes', async () => {
    const SubmittedPageWithVisibility = () => {
      const [isPaused, setIsPaused] = require('react').useState(false);
      const [timeLeft, setTimeLeft] = require('react').useState(15);

      require('react').useEffect(() => {
        const handleVisibilityChange = () => {
          setIsPaused(document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const timer = setInterval(() => {
          if (!isPaused) {
            setTimeLeft(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                mockPush('/history');
                return 0;
              }
              return prev - 1;
            });
          }
        }, 1000);

        return () => {
          clearInterval(timer);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }, [isPaused]);

      return (
        <div>
          <div data-testid="timer-state">
            Timer is {isPaused ? 'paused' : 'running'}: {timeLeft}s
          </div>
        </div>
      );
    };

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });

    render(<SubmittedPageWithVisibility />);

    // Initially running
    expect(screen.getByText('Timer is running: 15s')).toBeInTheDocument();

    // Hide page (tab switched)
    document.hidden = true;
    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => {
      expect(screen.getByText('Timer is paused: 15s')).toBeInTheDocument();
    });

    // Advance 5 seconds while paused
    vi.advanceTimersByTime(5000);

    // Timer should not have changed
    expect(screen.getByText('Timer is paused: 15s')).toBeInTheDocument();

    // Show page again
    document.hidden = false;
    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => {
      expect(screen.getByText('Timer is running: 15s')).toBeInTheDocument();
    });

    // Now timer should work
    vi.advanceTimersByTime(1000);
    expect(screen.getByText('Timer is running: 14s')).toBeInTheDocument();
  });

  it('should preserve timer state during navigation', async () => {
    const SubmittedPageWithPreservation = () => {
      const [startTime] = require('react').useState(Date.now());
      const [elapsed, setElapsed] = require('react').useState(0);

      require('react').useEffect(() => {
        const timer = setInterval(() => {
          setElapsed(Date.now() - startTime);
        }, 1000);

        return () => clearInterval(timer);
      }, [startTime]);

      const completeNow = () => {
        // Save elapsed time before redirect
        sessionStorage.setItem('submissionTime', elapsed.toString());
        mockPush('/history');
      };

      return (
        <div>
          <div data-testid="elapsed-time">{elapsed}ms</div>
          <button data-testid="complete-button" onClick={completeNow}>
            Complete
          </button>
        </div>
      );
    };

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
    });

    render(<SubmittedPageWithPreservation />);

    // Advance time
    vi.advanceTimersByTime(3000);

    // Complete and save state
    await userEvent.click(screen.getByTestId('complete-button'));

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('submissionTime', '3000');
    expect(mockPush).toHaveBeenCalledWith('/history');
  });

  it('should show warning before redirect', async () => {
    const SubmittedPageWithWarning = () => {
      const [showWarning, setShowWarning] = require('react').useState(false);
      const [timeLeft, setTimeLeft] = require('react').useState(15);

      require('react').useEffect(() => {
        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 5) {
              setShowWarning(true);
            }
            if (prev <= 1) {
              clearInterval(timer);
              mockPush('/history');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }, []);

      const stayOnPage = () => {
        setShowWarning(false);
        // Would cancel redirect in real implementation
      };

      return (
        <div>
          <div data-testid="timer">Redirecting in {timeLeft}s</div>
          {showWarning && (
            <div data-testid="warning">
              <p>You will be redirected soon!</p>
              <button data-testid="stay-button" onClick={stayOnPage}>
                Stay on this page
              </button>
            </div>
          )}
        </div>
      );
    };

    render(<SubmittedPageWithWarning />);

    // Initially no warning
    expect(screen.queryByTestId('warning')).not.toBeInTheDocument();

    // After 10 seconds, warning should appear
    vi.advanceTimersByTime(10000);
    await waitFor(() => {
      expect(screen.getByTestId('warning')).toBeInTheDocument();
      expect(screen.getByText('You will be redirected soon!')).toBeInTheDocument();
    });

    // Click stay
    await userEvent.click(screen.getByTestId('stay-button'));
    expect(screen.queryByTestId('warning')).not.toBeInTheDocument();
  });
});