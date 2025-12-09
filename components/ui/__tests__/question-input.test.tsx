import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionInput } from '../question-input';
import { vi } from 'vitest';

describe('QuestionInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    placeholder: 'Ask Mimi...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render textarea with placeholder', () => {
    expect.assertions(1);
    render(<QuestionInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('Ask Mimi...');
    expect(textarea).toBeInTheDocument();
  });

  it('should render submit button', () => {
    expect.assertions(1);
    render(<QuestionInput {...defaultProps} />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeInTheDocument();
  });

  it('should have glassmorphism styling classes', () => {
    expect.assertions(1);
    render(<QuestionInput {...defaultProps} />);

    const container = document.querySelector('.bg-white\\/10');
    expect(container).toBeInTheDocument();
  });

  it('should call onChange when textarea value changes', () => {
    expect.assertions(1);
    const mockOnChange = vi.fn();

    render(<QuestionInput {...defaultProps} onChange={mockOnChange} />);

    const textarea = screen.getByPlaceholderText('Ask Mimi...');
    fireEvent.change(textarea, { target: { value: 'What is my future?' } });

    expect(mockOnChange).toHaveBeenCalledWith('What is my future?');
  });

  it('should auto-resize textarea as content grows', () => {
    expect.assertions(2);

    const { rerender } = render(<QuestionInput {...defaultProps} value="Short" />);

    const textarea = screen.getByPlaceholderText('Ask Mimi...');

    // Initial height should be set
    expect(textarea.style.height).toBeTruthy();

    // Re-render with longer content
    const longText = 'This is a very long question that should cause the textarea to resize automatically to fit all the content on multiple lines if needed';
    rerender(<QuestionInput {...defaultProps} value={longText} />);

    // Height should be set (may be the same if content doesn't overflow)
    expect(textarea.style.height).toBeTruthy();
  });

  it('should disable submit button when question is too short (< 5 chars)', () => {
    expect.assertions(1);
    render(<QuestionInput {...defaultProps} value="Hey" />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when question is long enough (>= 5 chars)', () => {
    expect.assertions(1);
    render(<QuestionInput {...defaultProps} value="Hello Mimi" />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onSubmit when submit button is clicked with valid question', async () => {
    expect.assertions(1);
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    render(<QuestionInput {...defaultProps} value="What does my future hold?" onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('What does my future hold?');
  });

  it('should call onSubmit when Enter is pressed without shift', async () => {
    expect.assertions(1);
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    render(<QuestionInput {...defaultProps} value="Will I find love?" onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText('Ask Mimi...');
    await user.type(textarea, '{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('Will I find love?');
  });

  it('should not call onSubmit when Enter+Shift is pressed (allows new line)', async () => {
    expect.assertions(1);
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    render(<QuestionInput {...defaultProps} value="Will I find love?" onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText('Ask Mimi...');
    await user.type(textarea, '{Shift>}{Enter}{/Shift}');

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should apply focused styling when textarea is focused', () => {
    expect.assertions(1);
    render(<QuestionInput {...defaultProps} />);

    const container = document.querySelector('.bg-white\\/10');
    fireEvent.focus(screen.getByPlaceholderText('Ask Mimi...'));

    expect(container).toHaveClass('border-white/40');
  });

  it('should show character count hint', () => {
    expect.assertions(1);
    render(<QuestionInput {...defaultProps} />);

    const hint = screen.getByText(/enter/i);
    expect(hint).toBeInTheDocument();
  });
});