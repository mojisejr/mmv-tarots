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
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock the components
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

describe('Question Submission Flow Integration', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockImplementation(() => ({
      push: mockPush,
    }));
  });

  it('should submit question and navigate to submitted page with jobId', async () => {
    // Mock successful API response
    const mockResponse = {
      jobId: 'test-job-123',
      status: 'PENDING',
      message: 'Processing your tarot reading. Job ID: test-job-123'
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Import and render the Home component
    const { default: Home } = await import('../../page');
    render(<Home />);

    // Find and type in the question input
    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Will I find love in 2024?');

    // Submit the question
    await userEvent.click(submitButton);

    // Verify API was called with correct payload
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Will I find love in 2024?',
          userIdentifier: expect.any(String),
        }),
      });
    });

    // Verify navigation to submitted page with jobId
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/submitted?jobId=test-job-123');
    });
  });

  it('should handle API error gracefully', async () => {
    // Mock API error response
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      }),
    });

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Test question');
    await userEvent.click(submitButton);

    // Verify error is handled (should not navigate)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Should not navigate on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show loading state during API call', async () => {
    // Mock slow API response
    (fetch as any).mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ jobId: 'test-123', status: 'PENDING' }),
      }), 100))
    );

    const { default: Home } = await import('../../page');
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(textarea, 'Test question');
    await userEvent.click(submitButton);

    // Check for loading state (implementation specific)
    // This test will fail until loading state is implemented
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });
});