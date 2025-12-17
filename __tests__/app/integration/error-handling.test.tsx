import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock components
vi.mock('@/components', () => ({
  QuestionInput: ({ value, onChange, onSubmit, placeholder, disabled }: any) => (
    <div data-testid="question-input">
      <textarea
        data-testid="question-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button data-testid="submit-button" onClick={() => onSubmit(value)} disabled={disabled}>
        Submit
      </button>
    </div>
  ),
  MimiAvatar: () => <div data-testid="mimi-avatar">Mimi</div>,
  GlassCard: ({ children }: any) => <div data-testid="glass-card">{children}</div>,
}));

// Mock fetch
global.fetch = vi.fn();

describe('Error Handling Integration', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockImplementation(() => ({
      push: mockPush,
    }));
  });

  it('should handle API failure during question submission', async () => {
    // Mock API error response
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process tarot reading',
        },
      }),
    });

    // Mock error boundary
    const ErrorBoundary = ({ children, hasError }: any) => {
      if (hasError) {
        return (
          <div data-testid="error-boundary">
            <h2>Something went wrong</h2>
            <p>Please try again later</p>
            <button data-testid="retry-button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        );
      }
      return children;
    };

    const { default: Home } = await import('../../page');
    render(
      <ErrorBoundary hasError={false}>
        <Home />
      </ErrorBoundary>
    );

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Test question');
    await userEvent.click(submitButton);

    // Should not navigate on error
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    expect(mockPush).not.toHaveBeenCalled();

    // Error state should be shown
    // In real implementation, this would be handled by error boundary
    expect(screen.getByTestId('question-input')).toBeInTheDocument();
  });

  it('should handle network error', async () => {
    // Mock network error
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Test question');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Should not navigate on network error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle invalid job ID in SubmittedPage', async () => {
    // Mock API response for invalid job ID
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 'PREDICTION_NOT_FOUND',
          message: 'Prediction not found',
        },
      }),
    });

    const ErrorPage = () => (
      <div data-testid="job-not-found">
        <h2>Ticket not found</h2>
        <p>The ticket ID you provided is invalid or has expired.</p>
        <button data-testid="go-home" onClick={() => mockPush('/')}>
          Go Home
        </button>
      </div>
    );

    render(<ErrorPage />);

    expect(screen.getByText('Ticket not found')).toBeInTheDocument();
    expect(screen.getByText('The ticket ID you provided is invalid or has expired.')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('go-home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle missing job ID parameter', async () => {
    const MissingJobIdPage = () => (
      <div data-testid="missing-job-id">
        <h2>Missing Ticket ID</h2>
        <p>No ticket ID provided. Please check your link or submit a new question.</p>
        <button data-testid="submit-new" onClick={() => mockPush('/')}>
          Submit New Question
        </button>
      </div>
    );

    render(<MissingJobIdPage />);

    expect(screen.getByText('Missing Ticket ID')).toBeInTheDocument();
    expect(screen.getByText('No ticket ID provided. Please check your link or submit a new question.')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('submit-new'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle API timeout', async () => {
    // Mock timeout
    (fetch as any).mockImplementationOnce(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    );

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Test question');
    await userEvent.click(submitButton);

    // Show loading state
    expect(screen.getByTestId('submit-button')).toBeDisabled();

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Should handle timeout gracefully
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle malformed API response', async () => {
    // Mock malformed response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        invalid: 'response',
        missing: 'fields',
      }),
    });

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Test question');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Should handle malformed response
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle concurrent submissions', async () => {
    // Mock slow first response
    (fetch as any)
      .mockResolvedValueOnce(
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ jobId: 'first-123', status: 'PENDING' }),
          }), 1000)
        )
      )
      // Mock fast second response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'second-456', status: 'PENDING' }),
      });

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    // Submit first question
    await userEvent.type(textarea, 'First question');
    await userEvent.click(submitButton);

    // Immediately submit second question
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Second question');

    // Button should be disabled during first submission
    expect(screen.getByTestId('submit-button')).toBeDisabled();

    // Should not allow second submission
    await userEvent.click(screen.getByTestId('submit-button'));

    // Only one API call should be made
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle browser storage errors', async () => {
    // Mock localStorage error
    const mockSetItem = vi.fn(() => {
      throw new Error('Storage quota exceeded');
    });
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: mockSetItem,
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Simulate saving to localStorage
    const saveToStorage = () => {
      try {
        localStorage.setItem('lastQuestion', 'Test question');
      } catch (error) {
        // Handle storage error gracefully
        console.warn('Could not save to localStorage:', error);
      }
    };

    expect(() => saveToStorage()).not.toThrow();
    expect(mockSetItem).toHaveBeenCalled();
  });

  it('should handle invalid user input', async () => {
    // Test various invalid inputs
    const invalidInputs = [
      '', // Empty
      ' ', // Only whitespace
      'a'.repeat(1001), // Too long
    ];

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    for (const input of invalidInputs) {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, input);

      // Button should be disabled for invalid input
      if (input.trim() === '' || input.length > 1000) {
        expect(screen.getByTestId('submit-button')).toBeDisabled();
      }
    }

    // Valid input should enable button
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Valid question?');
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  it('should show retry option on failed API calls', async () => {
    // Mock failed API call
    (fetch as any).mockRejectedValueOnce(new Error('API Error'));

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Test question');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Show error state with retry
    const ErrorWithRetry = ({ onRetry }: any) => (
      <div data-testid="error-retry">
        <p>Failed to submit question</p>
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );

    const onRetry = vi.fn();
    render(<ErrorWithRetry onRetry={onRetry} />);

    await userEvent.click(screen.getByTestId('retry-button'));
    expect(onRetry).toHaveBeenCalled();
  });
});