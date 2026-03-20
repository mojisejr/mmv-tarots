import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageShell } from '@/components/layout/page-shell';

describe('PageShell', () => {
  it('renders children', () => {
    render(<PageShell>Hello World</PageShell>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies default max-w-4xl', () => {
    const { container } = render(<PageShell>Content</PageShell>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('max-w-4xl');
  });

  it('applies custom maxWidth', () => {
    const { container } = render(<PageShell maxWidth="3xl">Content</PageShell>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('max-w-3xl');
    expect(wrapper.className).not.toContain('max-w-4xl');
  });

  it('includes standard horizontal padding and centering', () => {
    const { container } = render(<PageShell>Content</PageShell>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('mx-auto');
    expect(wrapper.className).toContain('px-4');
    expect(wrapper.className).toContain('pt-10');
  });

  it('merges custom className', () => {
    const { container } = render(<PageShell className="md:pt-14">Content</PageShell>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('md:pt-14');
    expect(wrapper.className).toContain('mx-auto');
  });
});
