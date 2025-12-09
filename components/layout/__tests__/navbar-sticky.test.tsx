import { render, screen } from '@testing-library/react';
import { Navigation } from '../navbar';
import { vi } from 'vitest';

describe('Navigation - Sticky Behavior', () => {
  const defaultProps = {
    currentPage: 'home',
    isLoggedIn: false,
    onMenuClick: vi.fn(),
    onProfileClick: vi.fn(),
    onBackClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sticky Positioning', () => {
    it('should have fixed position for sticky behavior', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('fixed', 'top-0');
    });

    it('should have high z-index to stay above content', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('z-50');
    });

    it('should have full width coverage', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('left-0', 'right-0', 'w-full');
    });
  });

  describe('Visual Effects', () => {
    it('should have backdrop blur for glassmorphism effect', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('backdrop-blur-xl');
    });

    it('should have subtle background for readability', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('bg-black/20');
    });

    it('should have border for visual separation from content', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('border-b', 'border-white/10');
    });

    it('should have shadow for elevation effect', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('shadow-lg');
    });
  });

  describe('Scroll Behavior', () => {
    it('should maintain position when scrolling', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('sticky');
    });

    it('should have smooth transitions for visual effects', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Content Spacing', () => {
    it('should have proper height for navigation', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('h-16');
    });

    it('should maintain flex layout for button alignment', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper ARIA labels', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should have data-testid for testing', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt padding for mobile screens', () => {
      expect.assertions(1);
      render(<Navigation {...defaultProps} />);

      const navbar = screen.getByTestId('navbar');
      expect(navbar).toHaveClass('px-3', 'sm:px-6');
    });
  });
});