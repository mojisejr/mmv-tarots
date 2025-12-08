import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MimiLoadingAvatar } from '../mimi-loading-avatar';

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  Icosahedron: ({ args, ...props }: any) => (
    <mesh data-icosahedron-args={JSON.stringify(args)} {...props} />
  ),
}));

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => (
    <div data-testid="canvas-mimi-loading" {...props}>
      {children}
    </div>
  ),
  useFrame: () => {},
}));

describe('MimiLoadingAvatar', () => {
  it('should render the loading avatar', () => {
    render(<MimiLoadingAvatar />);

    const container = screen.getByTestId('canvas-mimi-loading');
    expect(container).toBeInTheDocument();
  });

  it('should render core mesh with correct size', () => {
    render(<MimiLoadingAvatar />);

    const container = screen.getByTestId('canvas-mimi-loading');
    const core = container.querySelector('[data-icosahedron-args="[1.2,0]"]');
    expect(core).toBeInTheDocument();
  });

  it('should render shell mesh with correct size', () => {
    render(<MimiLoadingAvatar />);

    const container = screen.getByTestId('canvas-mimi-loading');
    const shell = container.querySelector('[data-icosahedron-args="[1.6,1]"]');
    expect(shell).toBeInTheDocument();
  });

  it('should not render particles system', () => {
    render(<MimiLoadingAvatar />);

    const container = screen.getByTestId('canvas-mimi-loading');
    const particles = container.querySelector('[data-points-count]');
    expect(particles).not.toBeInTheDocument();
  });

  it('should have fade-in animation class', () => {
    render(<MimiLoadingAvatar />);

    const wrapper = screen.getByTestId('canvas-mimi-loading').parentElement;
    expect(wrapper).toHaveClass('animate-fade-in');
  });
});