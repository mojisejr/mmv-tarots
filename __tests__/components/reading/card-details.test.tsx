import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardDetails } from '../card-details';

// Mock dependencies
vi.mock('../../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('../../../components/features/tarot/tarot-card-image', () => ({
  TarotCardImage: ({ card, className }: any) => (
    <div className={className} data-testid="tarot-card-image">
      {card.displayName}
    </div>
  ),
}));

describe('CardDetails', () => {
  const mockCard = {
    position: 0,
    name_th: 'ความรัก',
    name_en: 'The Lovers',
    arcana: 'Major Arcana',
    keywords: ['ความรัก', 'ความสัมพันธ์', 'การเลือก'],
    interpretation: 'คุณกำลังอยู่ในช่วงเวลาของการตัดสินใจเกี่ยวกับความรัก',
    image: 'https://example.com/lovers.jpg',
  };

  it('displays card name in Thai primarily', () => {
    render(<CardDetails card={mockCard} />);

    const cardNameHeading = screen.getByRole('heading', { level: 3 });
    expect(cardNameHeading).toHaveTextContent(mockCard.name_th);
  });

  it('shows English name as secondary', () => {
    render(<CardDetails card={mockCard} />);

    expect(screen.getByText(mockCard.name_en)).toBeInTheDocument();
  });

  it('displays arcana type', () => {
    render(<CardDetails card={mockCard} />);

    expect(screen.getByText(mockCard.arcana)).toBeInTheDocument();
  });

  it('renders keywords as chips', () => {
    render(<CardDetails card={mockCard} />);

    const keywords = screen.getAllByTestId('keyword-chip');
    expect(keywords).toHaveLength(mockCard.keywords.length);
  });

  it('shows interpretation text', () => {
    render(<CardDetails card={mockCard} />);

    expect(screen.getByText(mockCard.interpretation)).toBeInTheDocument();
  });

  it('displays position name correctly', () => {
    render(<CardDetails card={mockCard} />);

    expect(screen.getByText('อดีต')).toBeInTheDocument();
  });

  it('shows "ปัจจุบัน" for position 1', () => {
    const presentCard = { ...mockCard, position: 1 };
    render(<CardDetails card={presentCard} />);

    expect(screen.getByText('ปัจจุบัน')).toBeInTheDocument();
  });

  it('shows "อนาคต" for position 2', () => {
    const futureCard = { ...mockCard, position: 2 };
    render(<CardDetails card={futureCard} />);

    expect(screen.getByText('อนาคต')).toBeInTheDocument();
  });

  it('applies correct CSS classes to keyword chips', () => {
    render(<CardDetails card={mockCard} />);

    const keywords = screen.getAllByTestId('keyword-chip');
    keywords.forEach(chip => {
      expect(chip).toHaveClass(
        'px-3',
        'py-1',
        'text-xs',
        'rounded-full',
        'bg-gradient-to-r',
        'from-[#ffffff1a]',
        'to-[#ffffff0d]',
        'border',
        'border-[#ffffff20]',
        'text-[#ffffffdd]'
      );
    });
  });

  it('has proper heading structure for accessibility', () => {
    render(<CardDetails card={mockCard} />);

    const cardNameHeading = screen.getByRole('heading', { level: 3 });
    expect(cardNameHeading).toBeInTheDocument();
    expect(cardNameHeading).toHaveTextContent(mockCard.name_th);
    expect(cardNameHeading).toHaveClass('text-xl', 'font-serif', 'text-white');
  });
});