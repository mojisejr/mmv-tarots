import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlassButton } from '../button';

// Mock test data
const mockOnClick = vi.fn();

describe('GlassButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with children text', () => {
    render(<GlassButton onClick={mockOnClick}>Test Button</GlassButton>);

    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    render(<GlassButton onClick={mockOnClick}>Click me</GlassButton>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should apply primary variant styles', () => {
    render(<GlassButton variant="primary" onClick={mockOnClick}>Primary</GlassButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[var(--primary)]/90');
  });

  it('should apply outline variant styles', () => {
    render(<GlassButton variant="outline" onClick={mockOnClick}>Outline</GlassButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<GlassButton disabled onClick={mockOnClick}>Disabled</GlassButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('disabled');
  });

  it('should not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    render(<GlassButton disabled onClick={mockOnClick}>Disabled</GlassButton>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should render with custom className', () => {
    render(<GlassButton className="custom-class" onClick={mockOnClick}>Custom</GlassButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render icon variant with only icon', () => {
    render(<GlassButton variant="icon" onClick={mockOnClick}>Icon</GlassButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-3.5');
  });

  it('should support line variant for special buttons', () => {
    render(<GlassButton variant="line" onClick={mockOnClick}>Line Button</GlassButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#06C755]');
  });
});