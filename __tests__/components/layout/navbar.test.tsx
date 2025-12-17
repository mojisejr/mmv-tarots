import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../navbar';
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
    onMenuClick: vi.fn(),
    onProfileClick: vi.fn(),
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

  it('should not render User profile button when logged out', () => {
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

  it('should have glassmorphism styling classes', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-white/10', 'backdrop-blur-2xl', 'border-white/20');
  });

  it('should show online indicator dot when logged in', () => {
    expect.assertions(1);
    render(<Navigation {...defaultProps} isLoggedIn={true} />);

    const onlineDot = document.querySelector('.rounded-full.border');
    expect(onlineDot).toBeInTheDocument();
  });
});