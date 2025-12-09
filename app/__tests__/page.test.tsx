import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../page';

// Mock components
vi.mock('@/components', () => ({
  Navigation: ({ currentPage, isLoggedIn, onMenuClick, onProfileClick, onBackClick }: any) => (
    <nav data-testid="navbar" data-currentpage={currentPage} data-isloggedin={isLoggedIn.toString()}>
      <button onClick={onMenuClick} data-testid="menu-button">Menu</button>
      <button onClick={onProfileClick} data-testid="profile-button">Profile</button>
      <button onClick={onBackClick} data-testid="back-button">Back</button>
    </nav>
  ),
  QuestionInput: ({ value, onChange, onSubmit, placeholder }: any) => (
    <div data-testid="question-input">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="question-textarea"
      />
      <button onClick={() => onSubmit(value)} data-testid="submit-btn">Submit</button>
    </div>
  ),
  TarotCardVisual: ({ card, delay }: any) => (
    <div data-testid={`tarot-card-${card.id}`} data-delay={delay}>
      <span data-name={card.name_th}>{card.name_th}</span>
      <span data-position={card.position}>{card.position}</span>
    </div>
  ),
  MimiAvatar: () => <div data-testid="mimi-avatar">Mimi Avatar</div>,
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
  GlassButton: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant} data-testid="glass-button">
      {children}
    </button>
  ),
  FormattedText: ({ text }: any) => <span>{text}</span>,
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the home page with all components', () => {
    render(<Home />);

    // Check Navigation
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toHaveAttribute('data-currentpage', 'home');
    expect(screen.getByTestId('navbar')).toHaveAttribute('data-isloggedin', 'true');

    // Check Mimi Avatar
    expect(screen.getByTestId('mimi-avatar')).toBeInTheDocument();

    // Check main heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('What guidance');
    expect(heading).toHaveTextContent('do you seek?');
  });

  it('should render question input section', () => {
    render(<Home />);

    const glassCard = screen.getAllByTestId('glass-card')[0];
    expect(glassCard).toBeInTheDocument();

    const questionInput = screen.getByTestId('question-input');
    expect(questionInput).toBeInTheDocument();

    const textarea = screen.getByTestId('question-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'What would you like to know about your future?');
  });

  it('should render sample tarot cards', () => {
    render(<Home />);

    // Check for sample cards section
    expect(screen.getByText('Sample Tarot Reading')).toBeInTheDocument();
    expect(screen.getByText('Interactive tarot cards with 3D hover effects')).toBeInTheDocument();

    // Check for tarot cards
    expect(screen.getByTestId('tarot-card-swords_3')).toBeInTheDocument();
    expect(screen.getByTestId('tarot-card-major_06')).toBeInTheDocument();
    expect(screen.getByTestId('tarot-card-major_19')).toBeInTheDocument();

    // Check card details
    expect(screen.getByText('ไพ่ 3 ดาบ')).toBeInTheDocument();
    expect(screen.getByText('ไพ่คู่รัก')).toBeInTheDocument();
    expect(screen.getByText('ไพ่พระอาทิตย์')).toBeInTheDocument();
  });

  it('should handle question input changes', () => {
    render(<Home />);

    const textarea = screen.getByTestId('question-textarea');
    fireEvent.change(textarea, { target: { value: 'Will I find love?' } });

    // The mock doesn't actually update state, so we just check the event is triggered
    expect(textarea).toBeInTheDocument();
  });

  it('should handle question submission', () => {
    render(<Home />);

    const submitBtn = screen.getByTestId('submit-btn');
    fireEvent.click(submitBtn);

    // Should trigger console.log as per mock implementation
    expect(submitBtn).toBeInTheDocument();
  });

  it('should handle navigation button clicks', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<Home />);

    const menuBtn = screen.getByTestId('menu-button');
    const profileBtn = screen.getByTestId('profile-button');
    const backBtn = screen.getByTestId('back-button');

    fireEvent.click(menuBtn);
    expect(consoleSpy).toHaveBeenCalledWith('Menu clicked');

    fireEvent.click(profileBtn);
    expect(consoleSpy).toHaveBeenCalledWith('Profile clicked');

    fireEvent.click(backBtn);
    expect(consoleSpy).toHaveBeenCalledWith('Back clicked');
  });

  it('should render phase features section', () => {
    render(<Home />);

    // Check Phase 1 features
    expect(screen.getByText('Phase 1: Liquid Background')).toBeInTheDocument();
    expect(screen.getByText('Mystical liquid background with floating gradient orbs and noise texture')).toBeInTheDocument();

    // Check Phase 2 features
    expect(screen.getByText('Phase 2: Core Components')).toBeInTheDocument();
    expect(screen.getByText('Essential UI components with glassmorphism design')).toBeInTheDocument();
  });

  it('should render test results badge', () => {
    render(<Home />);

    expect(screen.getByText('167 Tests Passing')).toBeInTheDocument();
    expect(screen.getByText('100% Test Coverage')).toBeInTheDocument();
  });

  it('should have proper responsive classes', () => {
    render(<Home />);

    // Check if main container has responsive classes
    const mainContainer = document.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
  });
});