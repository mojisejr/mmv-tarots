import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NavigationProvider, useNavigation } from '../providers/navigation-provider';

// Test component to consume the context
function TestComponent() {
  const {
    isLoggedIn,
    currentPage,
    setIsLoggedIn,
    setCurrentPage,
    handleMenuClick,
    handleProfileClick,
    handleBackClick,
  } = useNavigation();

  return (
    <div>
      <div data-testid="is-logged-in">{isLoggedIn.toString()}</div>
      <div data-testid="current-page">{currentPage}</div>
      <button onClick={() => setIsLoggedIn(false)}>Set Logged Out</button>
      <button onClick={() => setCurrentPage('about')}>Set Page</button>
      <button onClick={handleMenuClick} data-testid="menu-btn">
        Menu
      </button>
      <button onClick={handleProfileClick} data-testid="profile-btn">
        Profile
      </button>
      <button onClick={handleBackClick} data-testid="back-btn">
        Back
      </button>
    </div>
  );
}

describe('NavigationProvider', () => {
  it('should provide initial navigation state', () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
    expect(screen.getByTestId('current-page')).toHaveTextContent('home');
  });

  it('should update isLoggedIn state', () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    act(() => {
      screen.getByText('Set Logged Out').click();
    });

    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('false');
  });

  it('should update currentPage state', () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    act(() => {
      screen.getByText('Set Page').click();
    });

    expect(screen.getByTestId('current-page')).toHaveTextContent('about');
  });

  it('should handle navigation clicks', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    act(() => {
      screen.getByTestId('menu-btn').click();
    });
    expect(consoleSpy).toHaveBeenCalledWith('Menu clicked');

    act(() => {
      screen.getByTestId('profile-btn').click();
    });
    expect(consoleSpy).toHaveBeenCalledWith('Profile clicked');

    act(() => {
      screen.getByTestId('back-btn').click();
    });
    expect(consoleSpy).toHaveBeenCalledWith('Back clicked');

    consoleSpy.mockRestore();
  });

  it('should throw error when useNavigation is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNavigation must be used within a NavigationProvider');

    consoleSpy.mockRestore();
  });
});