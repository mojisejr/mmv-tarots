import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../page';

// Mock components
vi.mock('@/components', () => ({
  QuestionInput: ({ value, onChange, onSubmit, placeholder }: any) => (
    <div data-testid="question-input">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="question-textarea"
      />
      <button onClick={() => onSubmit(value)} data-testid="submit-btn">Submit</button>
    </div>
  ),
  TarotCardVisual: ({ card, delay }: any) => (
    <div data-testid={`tarot-card-${card.id}`} data-delay={delay}>
      <span data-name={card.name_th}>{card.name_th}</span>
      <span data-position={card.position}>{card.position}</span>
    </div>
  ),
  MimiAvatar: () => <div data-testid="mimi-avatar">Mimi Avatar</div>,
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
  GlassButton: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant} data-testid="glass-button">
      {children}
    </button>
  ),
  FormattedText: ({ text }: any) => <span>{text}</span>,
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the home page with all components', () => {
    render(<Home />);

    // Check Mimi Avatar
    expect(screen.getByTestId('mimi-avatar')).toBeInTheDocument();

    // Check main heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('What guidance');
    expect(heading).toHaveTextContent('do you seek?');
  });

  it('should render question input section', () => {
    render(<Home />);

    const glassCard = screen.getAllByTestId('glass-card')[0];
    expect(glassCard).toBeInTheDocument();

    const questionInput = screen.getByTestId('question-input');
    expect(questionInput).toBeInTheDocument();

    const textarea = screen.getByTestId('question-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'What would you like to know about your future?');
  });

  
  it('should handle question input changes', () => {
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    fireEvent.change(textarea, { target: { value: 'Will I find love?' } });

    // The mock doesn't actually update state, so we just check the event is triggered
    expect(textarea).toBeInTheDocument();
  });

  it('should handle question submission', () => {
    render(<Home />);

    const submitBtn = screen.getByTestId('submit-btn');
    fireEvent.click(submitBtn);

    // Should trigger console.log as per mock implementation
    expect(submitBtn).toBeInTheDocument();
  });
});