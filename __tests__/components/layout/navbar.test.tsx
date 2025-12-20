import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../../../components/layout/navbar';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
  usePathname: () => '/',
}));

describe('Navigation Component', () => {
  const defaultProps = {
    currentPage: 'home',
    isLoggedIn: true,
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
    },
    onMenuClick: vi.fn(),
    onProfileClick: vi.fn(),
    onLoginClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render MimiVibe logo in center', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} />);

    const logo = screen.getByText('MimiVibe');
    expect(logo).toBeInTheDocument();
  });

  it('should render Menu button on home page', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} currentPage="home" />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('should render Back button on non-home pages', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} currentPage="result" />);

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it('should render User profile button when logged in', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} isLoggedIn={true} />);

    const profileButton = screen.getByRole('button', { name: /profile/i });
    expect(profileButton).toBeInTheDocument();
  });

  it('should render Login button when logged out', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} isLoggedIn={false} />);

    const loginButton = screen.getByTestId('login-button');
    expect(loginButton).toBeInTheDocument();
  });

  it('should not render profile button when logged out', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} isLoggedIn={false} />);

    const profileButton = screen.queryByRole('button', { name: /profile/i });
    expect(profileButton).not.toBeInTheDocument();
  });

  it('should call onMenuClick when Menu button is clicked', () => {
    expect.assertions(1);
    const mockMenuClick = vi.fn();
    render(<Navigation {...defaultProps} currentPage="home" onMenuClick={mockMenuClick} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    expect(mockMenuClick).toHaveBeenCalledTimes(1);
  });

  it('should call onProfileClick when profile button is clicked', () => {
    expect.assertions(1);
    const mockProfileClick = vi.fn();
    render(<Navigation {...defaultProps} isLoggedIn={true} onProfileClick={mockProfileClick} />);

    const profileButton = screen.getByRole('button', { name: /profile/i });
    fireEvent.click(profileButton);

    expect(mockProfileClick).toHaveBeenCalledTimes(1);
  });

  it('should call onLoginClick when login button is clicked', () => {
    expect.assertions(1);
    const mockLoginClick = vi.fn();
    render(<Navigation {...defaultProps} isLoggedIn={false} onLoginClick={mockLoginClick} />);

    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    expect(mockLoginClick).toHaveBeenCalledTimes(1);
  });

  it('should show online indicator dot when logged in', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} isLoggedIn={true} />);

    const onlineDot = screen.getByLabelText('Online status indicator');
    expect(onlineDot).toBeInTheDocument();
  });

  it('should display user avatar when user has image', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} isLoggedIn={true} />);

    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
  });

  it('should display default avatar when user has no image', () => {
    expect.assertions(1);
    const propsWithoutImage = {
      ...defaultProps,
      user: { ...defaultProps.user, image: null },
    };
    render(<Navigation {...propsWithoutImage} isLoggedIn={true} />);

    const profileButton = screen.getByRole('button', { name: /profile/i });
    expect(profileButton).toBeInTheDocument();
  });
});