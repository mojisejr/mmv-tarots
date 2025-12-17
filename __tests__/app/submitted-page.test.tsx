import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SubmittedPage from '../submitted/page';

// Mock the MimiLoadingAvatar component
vi.mock('../../components/features/avatar/mimi-loading-avatar', () => ({
  MimiLoadingAvatar: () => <div data-testid="mimi-loading-avatar">Loading Avatar</div>
}));

// Mock the GlassCard component
vi.mock('../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  )
}));

// Mock the icons
vi.mock('../../components/icons', () => ({
  Sparkles: ({ className }: any) => <div data-testid="sparkles-icon" className={className} />,
  Zap: ({ className }: any) => <div data-testid="zap-icon" className={className} />,
  RefreshCw: ({ className }: any) => <div data-testid="refresh-icon" className={className} />,
  Moon: ({ className }: any) => <div data-testid="moon-icon" className={className} />,
  Copy: ({ className }: any) => <div data-testid="copy-icon" className={className} />,
  CheckCircle2: ({ className }: any) => <div data-testid="check-icon" className={className} />
}));

// Mock alert
global.alert = vi.fn();

// Mock constants
vi.mock('../../constants/waiting-steps', () => ({
  WAITING_STEPS: [
    { id: 'filter', label: 'Cleaning energy...', Icon: () => <div data-testid="sparkles-icon" /> },
    { id: 'analyzer', label: 'Sensing aura...', Icon: () => <div data-testid="zap-icon" /> },
    { id: 'selector', label: 'Shuffling...', Icon: () => <div data-testid="refresh-icon" /> },
    { id: 'reader', label: 'Interpreting...', Icon: () => <div data-testid="moon-icon" /> }
  ],
  FUN_FACTS: [
    "Did you know? The Death card rarely means physical death.",
    "Tarot originated in northern Italy in the 15th century.",
    "The Fool is the only card that is unnumbered.",
    "Mimi connects with the cosmic energy."
  ]
}));

describe('SubmittedPage', () => {
  const mockJobId = '12345';
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the submitted page with job ID', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByText(`#${mockJobId}`)).toBeInTheDocument();
    expect(screen.getByTestId('mimi-loading-avatar')).toBeInTheDocument();
  });

  it('displays the first waiting step initially', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    expect(screen.getByText('Cleaning energy...')).toBeInTheDocument();
    expect(screen.getByText('Sensing aura...')).toBeInTheDocument();
    expect(screen.getByText('Shuffling...')).toBeInTheDocument();
    expect(screen.getByText('Interpreting...')).toBeInTheDocument();
  });

  it('shows a progress bar', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar?.getAttribute('style')).toContain('width: 25%');
  });

  it('displays a fun fact', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    // The fun fact is displayed with quotes
    expect(screen.getByText('"Did you know? The Death card rarely means physical death."')).toBeInTheDocument();
  });

  it('copies job ID to clipboard when clicked', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    const jobIdElement = screen.getByText(`#${mockJobId}`);
    fireEvent.click(jobIdElement);

    expect(global.alert).toHaveBeenCalledWith(`Copied Ticket ID: ${mockJobId}`);
  });

  it('advances to next step after 3500ms', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    // Initially first step is active
    const firstStep = screen.getByText('Cleaning energy...').closest('[class*="scale-105"]');
    expect(firstStep).toBeInTheDocument();

    // Fast-forward 3500ms
    vi.advanceTimersByTime(3500);

    // Now second step should be active
    const secondStep = screen.getByText('Sensing aura...').parentElement?.parentElement?.querySelector('[class*="scale-105"]');
    expect(secondStep).toBeInTheDocument();
  });

  it('rotates fun facts every 5000ms', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    const initialFact = screen.getByText('"Did you know? The Death card rarely means physical death."');
    expect(initialFact).toBeInTheDocument();

    // Fast-forward 5000ms
    vi.advanceTimersByTime(5000);

    const nextFact = screen.getByText('"Tarot originated in northern Italy in the 15th century."');
    expect(nextFact).toBeInTheDocument();
  });

  it('calls onComplete after 15000ms', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    // Fast-forward 15000ms
    vi.advanceTimersByTime(15000);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('shows check icon for completed steps', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    // Fast-forward 3500ms to complete first step
    vi.advanceTimersByTime(3500);

    // First step should now have check icon
    const checkIcon = screen.getByText('Cleaning energy...').parentElement?.parentElement?.querySelector('[data-testid="check-icon"]');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows "You can close this window" message', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    expect(screen.getByText('You can close this window.')).toBeInTheDocument();
  });

  it('handles all four steps progression correctly', () => {
    render(<SubmittedPage jobId={mockJobId} onComplete={mockOnComplete} />);

    // Step 1 (0ms)
    expect(screen.getByText('Cleaning energy...').closest('[class*="scale-105"]')).toBeInTheDocument();

    // Step 2 (3500ms)
    vi.advanceTimersByTime(3500);
    expect(screen.getByText('Sensing aura...').closest('[class*="scale-105"]')).toBeInTheDocument();

    // Step 3 (7000ms)
    vi.advanceTimersByTime(3500);
    expect(screen.getByText('Shuffling...').closest('[class*="scale-105"]')).toBeInTheDocument();

    // Step 4 (10500ms)
    vi.advanceTimersByTime(3500);
    expect(screen.getByText('Interpreting...').closest('[class*="scale-105"]')).toBeInTheDocument();

    // Progress bar should be at 100%
    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar?.getAttribute('style')).toContain('width: 100%');
  });
});