import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedTarotCardVisual } from '../enhanced-tarot-card-visual';
import { TarotCard } from '../tarot-card';

// Mock the TarotCardImage component
vi.mock('../tarot-card-image', () => ({
  TarotCardImage: ({ card, className }: any) => (
    <div data-testid="tarot-card-image" className={className}>
      <img src={card.imageUrl} alt={card.displayName} />
    </div>
  ),
}));

describe('EnhancedTarotCardVisual', () => {
  const mockCard: TarotCard = {
    position: 1,
    id: '0',
    name_en: 'The Fool',
    name_th: 'ไพ่คนโงง่',
    image_url: 'https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/cards/the_fool.png',
    keywords: ['ความบริสุทธิ์', 'การเริ่มต้นใหม่'],
    orientation: 'upright',
    interpretation: 'Test interpretation',
  };

  it('should render card with real image instead of icon', () => {
    render(<EnhancedTarotCardVisual card={mockCard} />);

    // Should show the image component
    expect(screen.getByTestId('tarot-card-image')).toBeInTheDocument();
    expect(screen.getByAltText('The Fool')).toBeInTheDocument();
  });

  it('should display card information correctly', () => {
    render(<EnhancedTarotCardVisual card={mockCard} />);

    expect(screen.getByText('ไพ่คนโงง่')).toBeInTheDocument();
    expect(screen.getByText('The Fool')).toBeInTheDocument();
    expect(screen.getByText('ความบริสุทธิ์')).toBeInTheDocument();
    expect(screen.getByText('การเริ่มต้นใหม่')).toBeInTheDocument();
  });

  it('should show position when showPosition is true', () => {
    render(<EnhancedTarotCardVisual card={mockCard} showPosition={true} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should hide position when showPosition is false', () => {
    render(<EnhancedTarotCardVisual card={mockCard} showPosition={false} />);

    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('should apply animation delay correctly', () => {
    render(<EnhancedTarotCardVisual card={mockCard} delay={500} />);

    const container = screen.getByTestId('enhanced-tarot-card');
    expect(container).toHaveAttribute('style');
    expect(container.style.animationDelay).toBe('500ms');
  });

  it('should apply custom className', () => {
    render(<EnhancedTarotCardVisual card={mockCard} className="custom-test-class" />);

    const container = screen.getByTestId('enhanced-tarot-card');
    expect(container).toHaveClass('custom-test-class');
  });

  it('should have proper accessibility attributes', () => {
    render(<EnhancedTarotCardVisual card={mockCard} />);

    const container = screen.getByTestId('enhanced-tarot-card');
    expect(container).toHaveAttribute('role', 'article');
    expect(container).toHaveAttribute('aria-label', 'Tarot card: ไพ่คนโงง่ (The Fool)');
  });

  it('should handle cards without image_url', () => {
    const cardWithoutImage = {
      ...mockCard,
      image_url: '',
    };

    render(<EnhancedTarotCardVisual card={cardWithoutImage} />);

    // Should still render the component but without image
    expect(screen.getByTestId('enhanced-tarot-card')).toBeInTheDocument();
    expect(screen.getByText('ไพ่คนโงง่')).toBeInTheDocument();
  });

  it('should maintain glass morphism design', () => {
    render(<EnhancedTarotCardVisual card={mockCard} />);

    // Check for glass morphism elements
    expect(screen.getByText('ไพ่คนโงง่')).toBeInTheDocument();
    expect(screen.getByText('The Fool')).toBeInTheDocument();

    // Check that component renders with proper structure
    const container = screen.getByTestId('enhanced-tarot-card');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('relative', 'group');
  });

  it('should be responsive with correct aspect ratio', () => {
    render(<EnhancedTarotCardVisual card={mockCard} />);

    // Check for aspect ratio somewhere in the DOM structure
    const container = screen.getByTestId('enhanced-tarot-card');
    expect(container).toBeInTheDocument();

    // The aspect ratio should be applied to an inner container
    const innerContainer = container.querySelector('.aspect-\\[2\\/3\\]');
    expect(innerContainer).toBeInTheDocument();
  });
});