import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassCard } from '../card';

describe('GlassCard', () => {
  it('should render children content', () => {
    render(
      <GlassCard>
        <p>Card content</p>
      </GlassCard>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply default glass morphism classes', () => {
    render(
      <GlassCard>
        <p>Test</p>
      </GlassCard>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('backdrop-blur-xl');
    expect(card).toHaveClass('bg-glass-white');
    expect(card).toHaveClass('border-glass-border');
  });

  it('should apply custom className', () => {
    render(
      <GlassCard className="custom-test-class">
        <p>Test</p>
      </GlassCard>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('custom-test-class');
  });

  it('should have rounded corners', () => {
    render(
      <GlassCard>
        <p>Test</p>
      </GlassCard>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('rounded-[1.5rem]');
  });

  it('should have padding by default', () => {
    render(
      <GlassCard>
        <p>Test</p>
      </GlassCard>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('p-6');
  });
});