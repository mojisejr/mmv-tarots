import type { ReadingResult, MappedReadingData, DetailedCardReading } from '@/types/reading';

export function mapReadingData(reading: ReadingResult): MappedReadingData {
  return {
    header: reading.header,
    cards: reading.cards_reading.map(card => ({
      ...card,
      positionName: getPositionName(card.position),
      arcanaColor: getArcanaColor(card.arcana),
    })),
    reading: reading.reading,
    suggestions: reading.suggestions,
    nextQuestions: reading.next_questions,
    finalSummary: reading.final_summary,
    disclaimer: reading.disclaimer,
  };
}

function getPositionName(position: number): 'อดีต' | 'ปัจจุบัน' | 'อนาคต' {
  switch (position) {
    case 0: return 'อดีต';
    case 1: return 'ปัจจุบัน';
    case 2: return 'อนาคต';
    default: return 'อดีต' as const;
  }
}

function getArcanaColor(arcana: string): string {
  switch (arcana.toLowerCase()) {
    case 'major arcana':
      return '#FFD700'; // Gold
    case 'wands':
      return '#FF6B35'; // Orange/Red
    case 'cups':
      return '#4A90E2'; // Blue
    case 'swords':
      return '#95A5A6'; // Silver/Gray
    case 'pentacles':
      return '#27AE60'; // Green
    default:
      return '#FFFFFF'; // White
  }
}