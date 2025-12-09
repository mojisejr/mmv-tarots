import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock font imports to prevent errors in test environment
vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    variable: '--font-sans',
  }),
  Merriweather: () => ({
    variable: '--font-serif',
  }),
  Ubuntu_Mono: () => ({
    variable: '--font-mono',
  }),
}));

// Mock CSS imports
vi.mock('../globals.css', () => ({}));

// Mock components to isolate layout testing
vi.mock('@/components/background/liquid-background', () => ({
  LiquidBackground: () => <div data-testid="liquid-background">Background</div>,
}));

vi.mock('@/components/layout/main-navigation', () => ({
  MainNavigation: () => <div data-testid="main-navigation">Navigation</div>,
}));

vi.mock('@/lib/providers/navigation-provider', () => ({
  NavigationProvider: ({ children }: any) => <div>{children}</div>,
}));

// Import after mocking
import RootLayout from '../layout';

describe('Root Layout - Sticky Navigation Spacing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have proper padding top to account for sticky navigation', () => {
    expect.assertions(1);
    const TestPage = () => <div data-testid="test-page">Test Content</div>;

    render(
      <RootLayout>
        <TestPage />
      </RootLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toHaveClass('pt-16');
  });

  it('should have safe area top padding for iOS devices', () => {
    expect.assertions(1);
    const TestPage = () => <div data-testid="test-page">Test Content</div>;

    render(
      <RootLayout>
        <TestPage />
      </RootLayout>
    );

    const body = document.querySelector('body');
    expect(body).toHaveClass('safe-top');
  });

  it('should render navigation at the top', () => {
    expect.assertions(1);
    const TestPage = () => <div data-testid="test-page">Test Content</div>;

    render(
      <RootLayout>
        <TestPage />
      </RootLayout>
    );

    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
  });

  it('should have main element with flex-1 to take remaining space', () => {
    expect.assertions(1);
    const TestPage = () => <div data-testid="test-page">Test Content</div>;

    render(
      <RootLayout>
        <TestPage />
      </RootLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-1');
  });
});