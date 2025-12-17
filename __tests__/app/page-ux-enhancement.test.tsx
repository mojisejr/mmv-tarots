import { render, screen } from '@testing-library/react';
import Home from '../page';
import { vi } from 'vitest';

// Mock the components properly
vi.mock('@/components/ui/question-input', () => ({
  QuestionInput: ({ value, onChange, onSubmit, placeholder }: any) => (
    <div data-testid="question-input">
      <textarea
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="question-textarea"
        autoFocus
      />
      <button onClick={() => onSubmit(value)}>Submit</button>
    </div>
  ),
}));

vi.mock('@/components/features/avatar/mimi-avatar', () => ({
  MimiAvatar: () => <div data-testid="mimi-avatar">Avatar</div>,
}));

vi.mock('@/components/ui/glass-card', () => ({
  GlassCard: ({ children }: any) => <div data-testid="glass-card">{children}</div>,
}));

describe('Home Page - UX Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the home page', () => {
    expect.assertions(1);
    render(<Home />);

    expect(screen.getByTestId('mimi-avatar')).toBeInTheDocument();
  });

  it('should render the question input at the bottom', () => {
    expect.assertions(1);
    render(<Home />);

    expect(screen.getByTestId('question-input')).toBeInTheDocument();
  });

  it('should have proper bottom input container structure', () => {
    expect.assertions(1);
    render(<Home />);

    const bottomContainer = document.querySelector('.fixed.bottom-0.left-0.right-0');
    expect(bottomContainer).toBeInTheDocument();
  });

  it('should have proper z-index for bottom input', () => {
    expect.assertions(1);
    render(<Home />);

    const bottomContainer = document.querySelector('.z-50');
    expect(bottomContainer).toBeInTheDocument();
  });

  it('should have background styling for bottom input', () => {
    expect.assertions(1);
    render(<Home />);

    const bottomContainer = document.querySelector('.bg-black\\/20.backdrop-blur-xl');
    expect(bottomContainer).toBeInTheDocument();
  });

  it('should have border top for visual separation', () => {
    expect.assertions(1);
    render(<Home />);

    const bottomContainer = document.querySelector('.border-t');
    expect(bottomContainer).toBeInTheDocument();
  });

  it('should have shadow for elevation', () => {
    expect.assertions(1);
    render(<Home />);

    const bottomContainer = document.querySelector('.shadow-2xl');
    expect(bottomContainer).toBeInTheDocument();
  });

  it('should have padding at bottom of main content', () => {
    expect.assertions(1);
    render(<Home />);

    const mainContent = document.querySelector('.pb-20.sm\\:pb-24');
    expect(mainContent).toBeInTheDocument();
  });

  it('should have max width constraint on input wrapper', () => {
    expect.assertions(1);
    render(<Home />);

    const inputWrapper = document.querySelector('.max-w-4xl');
    expect(inputWrapper).toBeInTheDocument();
  });

  it('should have horizontal padding for input wrapper', () => {
    expect.assertions(1);
    render(<Home />);

    const inputWrapper = document.querySelector('[data-testid="input-wrapper"]');
    expect(inputWrapper).toBeInTheDocument();
  });
});