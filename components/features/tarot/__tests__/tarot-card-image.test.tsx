import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TarotCardImage } from '../tarot-card-image';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onError,
    onLoad,
    priority,
    loading,
    ...props
  }: any) => (
    <img
      src={src}
      alt={alt}
      onError={onError}
      onLoad={onLoad}
      data-testid="tarot-card-img"
      data-priority={priority}
      data-loading={loading}
      {...props}
    />
  ),
}));

describe('TarotCardImage', () => {
  const mockCard = {
    id: 0,
    name: 'the_fool',
    displayName: 'The Fool',
    imageUrl: 'https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/cards/the_fool.png',
    arcana: 'Major Arcana',
    shortMeaning: 'Beginner\'s mind, innocence',
    longMeaning: 'Test meaning',
    longMeaningRaw: 'Test raw meaning',
    keywords: ['beginning', 'innocence'],
  };

  it('should render card image with correct src and alt text', () => {
    render(<TarotCardImage card={mockCard} />);

    const img = screen.getByTestId('tarot-card-img');
    expect(img).toHaveAttribute('src', mockCard.imageUrl);
    expect(img).toHaveAttribute('alt', `The Fool tarot card`);
  });

  it('should show loading state initially', () => {
    render(<TarotCardImage card={mockCard} />);

    // Should show loading spinner initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should hide loading state after image loads', async () => {
    render(<TarotCardImage card={mockCard} />);

    const img = screen.getByTestId('tarot-card-img');

    // Simulate successful image load
    fireEvent.load(img);

    // Loading state should be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('should show fallback icon on image load error', async () => {
    render(<TarotCardImage card={mockCard} />);

    const img = screen.getByTestId('tarot-card-img');

    // Simulate image load error
    fireEvent.error(img);

    // Should show fallback icon instead
    await waitFor(() => {
      expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
    });
  });

  it('should handle missing imageUrl gracefully', () => {
    const cardWithoutImage = {
      ...mockCard,
      imageUrl: '',
    };

    render(<TarotCardImage card={cardWithoutImage} />);

    // Should show fallback immediately since no image URL
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes for card styling', () => {
    render(<TarotCardImage card={mockCard} className="custom-class" />);

    const container = screen.getByTestId('tarot-card-image-container');
    expect(container).toHaveClass('tarot-card-image-container');
    expect(container).toHaveClass('custom-class');
  });

  it('should lazy load images when lazy prop is true', () => {
    render(<TarotCardImage card={mockCard} lazy={true} />);

    const img = screen.getByTestId('tarot-card-img');
    expect(img).toHaveAttribute('data-loading', 'lazy');
  });

  it('should prioritize loading when priority prop is true', () => {
    render(<TarotCardImage card={mockCard} priority={true} />);

    const img = screen.getByTestId('tarot-card-img');
    expect(img).toHaveAttribute('data-priority', 'true');
  });
});