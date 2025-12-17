import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Sparkles,
  Moon,
  Star,
  History,
  Search,
  ArrowRight,
  ArrowUp,
  Loader2,
  Copy,
  CheckCircle2,
  RefreshCw,
  Zap,
  Menu,
  ChevronRight,
  ChevronLeft,
  LogIn,
  Heart,
  Sword,
  Sun,
  AlertCircle,
  MessageCircle,
  User,
  Coins,
  Gift,
  CreditCard,
  LogOut,
  Share2,
  Gem,
} from '../icons';

describe('Icon Components', () => {
  const testIcon = (IconComponent: React.ComponentType<React.SVGAttributes<SVGSVGElement>>, testName: string) => {
    it(`should render ${testName} icon`, () => {
      render(<IconComponent />);

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it(`should apply custom className to ${testName}`, () => {
      render(<IconComponent className="test-class" />);

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('test-class');
    });

    it(`should support width and height props for ${testName}`, () => {
      render(<IconComponent width={32} height={32} />);

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
    });
  };

  // Test all icon components
  testIcon(Sparkles, 'Sparkles');
  testIcon(Moon, 'Moon');
  testIcon(Star, 'Star');
  testIcon(History, 'History');
  testIcon(Search, 'Search');
  testIcon(ArrowRight, 'ArrowRight');
  testIcon(ArrowUp, 'ArrowUp');
  testIcon(Loader2, 'Loader2');
  testIcon(Copy, 'Copy');
  testIcon(CheckCircle2, 'CheckCircle2');
  testIcon(RefreshCw, 'RefreshCw');
  testIcon(Zap, 'Zap');
  testIcon(Menu, 'Menu');
  testIcon(ChevronRight, 'ChevronRight');
  testIcon(ChevronLeft, 'ChevronLeft');
  testIcon(LogIn, 'LogIn');
  testIcon(Heart, 'Heart');
  testIcon(Sword, 'Sword');
  testIcon(Sun, 'Sun');
  testIcon(AlertCircle, 'AlertCircle');
  testIcon(MessageCircle, 'MessageCircle');
  testIcon(User, 'User');
  testIcon(Coins, 'Coins');
  testIcon(Gift, 'Gift');
  testIcon(CreditCard, 'CreditCard');
  testIcon(LogOut, 'LogOut');
  testIcon(Share2, 'Share2');
  testIcon(Gem, 'Gem');

  it('should pass through additional props', () => {
    render(<Sparkles data-testid="custom-icon" />);

    const icon = screen.getByTestId('custom-icon');
    expect(icon).toBeInTheDocument();
  });
});