import { render, screen } from '@testing-library/react';
import { LiquidBackground } from '../liquid-background';

describe('LiquidBackground', () => {
  it('should render the background component', () => {
    expect(() => render(<LiquidBackground />)).not.toThrow();
  });

  it('should have the base dark background', () => {
    render(<LiquidBackground />);
    const baseBackground = screen.getByTestId('liquid-background-base');
    expect(baseBackground).toHaveClass('bg-[#2a2a2e]');
  });

  it('should render three floating gradient orbs', () => {
    render(<LiquidBackground />);
    const orbs = screen.getAllByTestId(/floating-orb/);
    expect(orbs).toHaveLength(3);
  });

  it('should have the primary color orb with correct classes', () => {
    render(<LiquidBackground />);
    const primaryOrb = screen.getByTestId('floating-orb-primary');
    expect(primaryOrb).toHaveClass('bg-[var(--primary)]');
    expect(primaryOrb).toHaveClass('animate-float-slow');
    expect(primaryOrb).toHaveClass('opacity-20');
  });

  it('should have the accent color orb with correct classes', () => {
    render(<LiquidBackground />);
    const accentOrb = screen.getByTestId('floating-orb-accent');
    expect(accentOrb).toHaveClass('bg-[var(--accent)]');
    expect(accentOrb).toHaveClass('animate-float-delayed');
    expect(accentOrb).toHaveClass('opacity-15');
  });

  it('should have the purple orb with correct classes', () => {
    render(<LiquidBackground />);
    const purpleOrb = screen.getByTestId('floating-orb-purple');
    expect(purpleOrb).toHaveClass('bg-purple-500');
    expect(purpleOrb).toHaveClass('animate-pulse-slow');
    expect(purpleOrb).toHaveClass('opacity-10');
  });

  it('should have noise texture overlay', () => {
    render(<LiquidBackground />);
    const noiseTexture = screen.getByTestId('noise-texture');
    expect(noiseTexture).toHaveClass('liquid-noise');
    expect(noiseTexture).toHaveClass('opacity-[0.03]');
  });

  it('should have correct positioning and z-index', () => {
    render(<LiquidBackground />);
    const container = screen.getByTestId('liquid-background-container');
    expect(container).toHaveClass('fixed', 'inset-0', 'z-0');
    expect(container).toHaveClass('overflow-hidden', 'pointer-events-none');
  });

  it('should match snapshot', () => {
    const { container } = render(<LiquidBackground />);
    expect(container).toMatchSnapshot();
  });
});