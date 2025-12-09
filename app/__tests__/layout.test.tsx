import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout from '../layout';

// Mock components
vi.mock('@/components/background/liquid-background', () => ({
  LiquidBackground: () => <div data-testid="liquid-background">Background</div>,
}));

vi.mock('@/components/layout/navbar', () => ({
  Navigation: ({ currentPage, isLoggedIn, onMenuClick, onProfileClick, onBackClick }: any) => (
    <nav data-testid="navbar" data-currentpage={currentPage} data-isloggedin={isLoggedIn.toString()}>
      <button onClick={onMenuClick}>Menu</button>
      <button onClick={onProfileClick}>Profile</button>
      <button onClick={onBackClick}>Back</button>
    </nav>
  ),
}));

vi.mock('@/lib/providers/navigation-provider', () => ({
  NavigationProvider: ({ children }: any) => (
    <div data-testid="navigation-provider">{children}</div>
  ),
  useNavigation: () => ({
    isLoggedIn: true,
    currentPage: 'home',
    handleMenuClick: vi.fn(),
    handleProfileClick: vi.fn(),
    handleBackClick: vi.fn(),
  }),
}));

describe('RootLayout', () => {
  it('should render layout with NavigationProvider', () => {
    render(
      <RootLayout>
        <div>Test Page</div>
      </RootLayout>
    );

    expect(screen.getByTestId('navigation-provider')).toBeInTheDocument();
  });

  it('should render LiquidBackground', () => {
    render(
      <RootLayout>
        <div>Test Page</div>
      </RootLayout>
    );

    expect(screen.getByTestId('liquid-background')).toBeInTheDocument();
  });

  it('should include children content', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Page Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Page Content');
  });

  it('should have correct HTML structure', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    expect(document.querySelector('html')).toHaveAttribute('lang', 'en');
    expect(document.body).toHaveClass(
      'antialiased',
      'bg-[#2a2a2e]',
      'text-white'
    );
  });
});