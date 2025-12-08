import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MimiAvatar } from '../mimi-avatar';

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  Icosahedron: ({ args, ...props }: any) => (
    <mesh data-icosahedron-args={JSON.stringify(args)} {...props} />
  ),
  Points: ({ positions, ...props }: any) => (
    <points data-points-count={positions?.length / 3 || 0} {...props} />
  ),
}));

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => (
    <div data-testid="canvas-mimi-avatar" {...props}>
      {children}
    </div>
  ),
  useFrame: () => {},
}));

describe('MimiAvatar', () => {
  it('should render the avatar', () => {
    render(<MimiAvatar />);

    const container = screen.getByTestId('canvas-mimi-avatar');
    expect(container).toBeInTheDocument();
  });

  it('should render core mesh with correct size', () => {
    render(<MimiAvatar />);

    const container = screen.getByTestId('canvas-mimi-avatar');
    const core = container.querySelector('[data-icosahedron-args="[1.2,0]"]');
    expect(core).toBeInTheDocument();
  });

  it('should render shell mesh with correct size', () => {
    render(<MimiAvatar />);

    const container = screen.getByTestId('canvas-mimi-avatar');
    const shell = container.querySelector('[data-icosahedron-args="[1.8,1]"]');
    expect(shell).toBeInTheDocument();
  });

  it('should render particles system', () => {
    render(<MimiAvatar />);

    const container = screen.getByTestId('canvas-mimi-avatar');
    const particles = container.querySelector('[data-points-count="200"]');
    expect(particles).toBeInTheDocument();
  });

  it('should have fade-in animation class', () => {
    render(<MimiAvatar />);

    const wrapper = screen.getByTestId('canvas-mimi-avatar').parentElement;
    expect(wrapper).toHaveClass('animate-fade-in');
  });
});