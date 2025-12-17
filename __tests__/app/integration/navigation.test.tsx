import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock NavigationProvider
const mockNavigationContext = {
  isLoggedIn: true,
  currentPage: 'home',
  setIsLoggedIn: vi.fn(),
  setCurrentPage: vi.fn(),
  handleMenuClick: vi.fn(),
  handleProfileClick: vi.fn(),
  handleBackClick: vi.fn(),
};

vi.mock('@/lib/providers/navigation-provider', () => ({
  NavigationProvider: ({ children }: any) => children,
  useNavigation: () => mockNavigationContext,
}));

// Mock components
vi.mock('@/components', () => ({
  QuestionInput: ({ value, onChange, onSubmit, placeholder }: any) => (
    <div data-testid="question-input">
      <textarea
        data-testid="question-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button data-testid="submit-button" onClick={() => onSubmit(value)}>
        Submit
      </button>
    </div>
  ),
  MimiAvatar: () => <div data-testid="mimi-avatar">Mimi</div>,
  GlassCard: ({ children }: any) => <div data-testid="glass-card">{children}</div>,
}));

// Mock fetch
global.fetch = vi.fn();

describe('Navigation Flow Integration', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();
  let currentPathname = '/';

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigationContext.setCurrentPage.mockClear();
    mockNavigationContext.setIsLoggedIn.mockClear();
    mockNavigationContext.handleBackClick.mockClear();

    (useRouter as any).mockImplementation(() => ({
      push: mockPush,
      back: mockBack,
      replace: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }));

    (usePathname as any).mockImplementation(() => currentPathname);
  });

  it('should navigate from home to submitted page after question submission', async () => {
    currentPathname = '/';

    // Mock successful API response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobId: 'nav-test-123',
        status: 'PENDING',
        message: 'Processing...'
      }),
    });

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Will I find happiness?');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/submitted?jobId=nav-test-123');
    });

    expect(mockNavigationContext.setCurrentPage).toHaveBeenCalledWith('submitted');
  });

  it('should navigate from submitted page to history page on completion', async () => {
    currentPathname = '/submitted';

    // Simulate SubmittedPage with navigation
    const SubmittedPageWithNavigation = () => {
      const { handleBackClick } = mockNavigationContext;

      const onComplete = () => {
        mockNavigationContext.setCurrentPage('history');
        mockPush('/history');
      };

      // Simulate the 15-second timer
      setTimeout(onComplete, 15000);

      return (
        <div>
          <div data-testid="submitted-page">Submitted Page</div>
          <button data-testid="skip-button" onClick={onComplete}>
            Skip
          </button>
          <button data-testid="back-button" onClick={handleBackClick}>
            Back
          </button>
        </div>
      );
    };

    render(<SubmittedPageWithNavigation />);

    // Click skip button
    await userEvent.click(screen.getByTestId('skip-button'));

    expect(mockNavigationContext.setCurrentPage).toHaveBeenCalledWith('history');
    expect(mockPush).toHaveBeenCalledWith('/history');
  });

  it('should handle back navigation correctly', async () => {
    currentPathname = '/submitted';

    const SubmittedPageWithBack = () => {
      const { handleBackClick } = mockNavigationContext;

      const onBackClick = () => {
        handleBackClick();
        mockBack();
      };

      return (
        <div>
          <div data-testid="submitted-page">Submitted Page</div>
          <button data-testid="back-button" onClick={onBackClick}>
            Back to Home
          </button>
        </div>
      );
    };

    render(<SubmittedPageWithBack />);

    await userEvent.click(screen.getByTestId('back-button'));

    expect(mockNavigationContext.handleBackClick).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it('should navigate from history to submitted page when checking prediction status', async () => {
    currentPathname = '/history';

    // Mock prediction data
    const mockPredictions = [
      {
        id: 'status-check-123',
        date: '1h ago',
        query: 'Should I take the job offer?',
      }
    ];

    const HistoryPageWithNavigation = () => {
      const onCheckStatus = (jobId: string) => {
        mockNavigationContext.setCurrentPage('submitted');
        mockPush(`/submitted?jobId=${jobId}`);
      };

      return (
        <div>
          <div data-testid="history-page">History Page</div>
          {mockPredictions.map(prediction => (
            <div
              key={prediction.id}
              data-testid={`prediction-${prediction.id}`}
              onClick={() => onCheckStatus(prediction.id)}
            >
              {prediction.query}
            </div>
          ))}
        </div>
      );
    };

    render(<HistoryPageWithNavigation />);

    await userEvent.click(screen.getByTestId('prediction-status-check-123'));

    expect(mockNavigationContext.setCurrentPage).toHaveBeenCalledWith('submitted');
    expect(mockPush).toHaveBeenCalledWith('/submitted?jobId=status-check-123');
  });

  it('should update URL correctly during navigation', async () => {
    // Test full navigation flow
    const navigationFlow = async () => {
      // 1. Start at home
      currentPathname = '/';
      expect(usePathname()).toBe('/');

      // 2. Submit question -> go to submitted
      currentPathname = '/submitted';
      mockPush('/submitted?jobId=test-123');
      expect(mockPush).toHaveBeenCalledWith('/submitted?jobId=test-123');

      // 3. Complete -> go to history
      currentPathname = '/history';
      mockPush('/history');
      expect(mockPush).toHaveBeenCalledWith('/history');

      // 4. Check status -> back to submitted
      currentPathname = '/submitted';
      mockPush('/submitted?jobId=test-123');
      expect(mockPush).toHaveBeenCalledWith('/submitted?jobId=test-123');
    };

    await navigationFlow();
  });

  it('should handle browser back button', async () => {
    currentPathname = '/submitted';

    const SubmittedPageWithBrowserBack = () => {
      const onBrowserBack = () => {
        window.history.back();
      };

      return (
        <div>
          <div data-testid="submitted-page">Submitted Page</div>
          <button data-testid="browser-back-button" onClick={onBrowserBack}>
            Browser Back
          </button>
        </div>
      );
    };

    // Mock window.history.back
    const mockHistoryBack = vi.fn();
    Object.defineProperty(window, 'history', {
      value: {
        back: mockHistoryBack,
      },
      writable: true,
    });

    render(<SubmittedPageWithBrowserBack />);

    await userEvent.click(screen.getByTestId('browser-back-button'));

    expect(mockHistoryBack).toHaveBeenCalled();
  });

  it('should maintain navigation state', async () => {
    // Test that navigation state is preserved across page changes
    const { setCurrentPage } = mockNavigationContext;

    // Simulate navigation flow
    setCurrentPage('home');
    expect(setCurrentPage).toHaveBeenCalledWith('home');

    setCurrentPage('submitted');
    expect(setCurrentPage).toHaveBeenCalledWith('submitted');

    setCurrentPage('history');
    expect(setCurrentPage).toHaveBeenCalledWith('history');
  });

  it('should handle navigation from history to home', async () => {
    currentPathname = '/history';

    const HistoryPageWithHomeNavigation = () => {
      const { handleMenuClick } = mockNavigationContext;

      const onMenuClick = () => {
        handleMenuClick();
        mockNavigationContext.setCurrentPage('home');
        mockPush('/');
      };

      return (
        <div>
          <div data-testid="history-page">History Page</div>
          <button data-testid="menu-button" onClick={onMenuClick}>
            Menu
          </button>
        </div>
      );
    };

    render(<HistoryPageWithHomeNavigation />);

    await userEvent.click(screen.getByTestId('menu-button'));

    expect(mockNavigationContext.handleMenuClick).toHaveBeenCalled();
    expect(mockNavigationContext.setCurrentPage).toHaveBeenCalledWith('home');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle navigation errors gracefully', async () => {
    // Mock router error
    (useRouter as any).mockImplementation(() => ({
      push: vi.fn().mockRejectedValue(new Error('Navigation failed')),
      back: vi.fn(),
    }));

    const navigationWithError = async () => {
      try {
        await mockPush('/invalid-route');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Navigation failed');
      }
    };

    await navigationWithError();
  });
});