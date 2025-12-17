import { render, screen } from '@testing-library/react';
import { TarotCardVisual } from '../tarot-card';

const mockCard = {
  position: 1,
  id: 'swords_3',
  name_en: 'Three of Swords',
  name_th: 'ไพ่ 3 ดาบ',
  image_url: '/assets/cards/swords/3.jpg',
  keywords: ['ความเจ็บปวด', 'แผลใจ', 'รักสามเส้า'],
  orientation: 'upright',
  interpretation: 'ไพ่ใบแรกเปิดมาเจอความเจ็บปวดเลย เหมือนหนูเพิ่งผ่านเรื่องที่ทำให้ร้องไห้หนักๆ มา',
};

describe('TarotCardVisual Component', () => {
  const defaultProps = {
    card: mockCard,
    delay: 150,
  };

  it('should render card position', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} />);

    const position = screen.getByText('1');
    expect(position).toBeInTheDocument();
  });

  it('should render card names in Thai and English', () => {
    expect.assertions(2);
    render(<TarotCardVisual {...defaultProps} />);

    expect(screen.getByText('ไพ่ 3 ดาบ')).toBeInTheDocument();
    expect(screen.getByText('Three of Swords')).toBeInTheDocument();
  });

  it('should render all keywords', () => {
    expect.assertions(3);
    render(<TarotCardVisual {...defaultProps} />);

    expect(screen.getByText('ความเจ็บปวด')).toBeInTheDocument();
    expect(screen.getByText('แผลใจ')).toBeInTheDocument();
    expect(screen.getByText('รักสามเส้า')).toBeInTheDocument();
  });

  it('should display correct icon for sword cards', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} />);

    const swordIcon = document.querySelector('[data-testid="sword-icon"]');
    expect(swordIcon).toBeInTheDocument();
  });

  it('should display heart icon for Lovers card', () => {
    expect.assertions(1);
    const loversCard = {
      ...mockCard,
      id: 'major_06',
      name_th: 'ไพ่คู่รัก',
      name_en: 'The Lovers',
    };

    render(<TarotCardVisual {...defaultProps} card={loversCard} />);

    const heartIcon = document.querySelector('[data-testid="heart-icon"]');
    expect(heartIcon).toBeInTheDocument();
  });

  it('should display sun icon for Sun card', () => {
    expect.assertions(1);
    const sunCard = {
      ...mockCard,
      id: 'major_19',
      name_th: 'ไพ่พระอาทิตย์',
      name_en: 'The Sun',
    };

    render(<TarotCardVisual {...defaultProps} card={sunCard} />);

    const sunIcon = document.querySelector('[data-testid="sun-icon"]');
    expect(sunIcon).toBeInTheDocument();
  });

  it('should display sparkles icon for other cards', () => {
    expect.assertions(1);
    const otherCard = {
      ...mockCard,
      id: 'some_other_card',
    };

    render(<TarotCardVisual {...defaultProps} card={otherCard} />);

    const sparklesIcon = document.querySelector('[data-testid="sparkles-icon"]');
    expect(sparklesIcon).toBeInTheDocument();
  });

  it('should have glassmorphism styling classes', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} />);

    const card = document.querySelector('.bg-gradient-to-br');
    expect(card).toBeInTheDocument();
  });

  it('should have aspect ratio of 2/3', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} />);

    const card = document.querySelector('.aspect-\\[2\\/3\\]');
    expect(card).toBeInTheDocument();
  });

  it('should have animation delay applied', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} delay={300} />);

    const card = document.querySelector('.animate-fade-in-up');
    expect(card).toBeInTheDocument();
  });

  it('should have hover scale effect', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} />);

    const card = document.querySelector('.hover\\:scale-\\[1\\.02\\]');
    expect(card).toBeInTheDocument();
  });

  it('should have perspective wrapper for 3D effects', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} />);

    const wrapper = document.querySelector('.perspective-1000');
    expect(wrapper).toBeInTheDocument();
  });

  it('should have proper width for card', () => {
    expect.assertions(1);
    render(<TarotCardVisual {...defaultProps} />);

    const wrapper = document.querySelector('.w-\\[260px\\]');
    expect(wrapper).toBeInTheDocument();
  });
});