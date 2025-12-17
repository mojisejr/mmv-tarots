import type { ReadingResult, MappedReadingData, DetailedCardReading } from '@/types/reading';

export function mapReadingData(reading: ReadingResult | null | undefined): MappedReadingData | null {
  // Validate input
  if (!reading || typeof reading !== 'object') {
    console.error('mapReadingData: Invalid input - reading is null, undefined, or not an object');
    return null;
  }

  try {
    // Handle cards_reading - could be array, JSON string, or invalid
    let cardsData = [];
    if (reading.cards_reading) {
      if (Array.isArray(reading.cards_reading)) {
        cardsData = reading.cards_reading;
      } else if (typeof reading.cards_reading === 'string') {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(reading.cards_reading);
          if (Array.isArray(parsed)) {
            cardsData = parsed;
          } else {
            console.warn('mapReadingData: cards_reading is valid JSON but not an array');
            cardsData = [];
          }
        } catch {
          // Not valid JSON string
          console.warn('mapReadingData: cards_reading is a string but not valid JSON');
          cardsData = [];
        }
      } else {
        console.warn('mapReadingData: cards_reading is neither array nor string');
        cardsData = [];
      }
    }

    // Validate and map cards
    const validCards = cardsData.filter((card: any) =>
      card &&
      typeof card === 'object' &&
      'position' in card &&
      'name_th' in card &&
      typeof card.position === 'number'  // Ensure position is a number
    );

    // Type checking for all fields with fallbacks
    const header = typeof reading.header === 'string' ? reading.header : '';
    const readingText = typeof reading.reading === 'string' ? reading.reading : '';
    const suggestions = Array.isArray(reading.suggestions)
      ? reading.suggestions.filter(s => typeof s === 'string')
      : [];
    const nextQuestions = Array.isArray(reading.next_questions)
      ? reading.next_questions.filter(q => typeof q === 'string')
      : [];
    const finalSummary = typeof reading.final_summary === 'string' ? reading.final_summary : '';
    const disclaimer = typeof reading.disclaimer === 'string' ? reading.disclaimer : '';

    // If no valid data at all, return null
    if (!header && !readingText && validCards.length === 0 &&
        suggestions.length === 0 && nextQuestions.length === 0 &&
        !finalSummary && !disclaimer) {
      console.warn('mapReadingData: No valid data found in reading object');
      return null;
    }

    return {
      header,
      cards: validCards.map(card => ({
        ...card,
        positionName: getPositionName(card.position),
        arcanaColor: getArcanaColor(card.arcana),
      })),
      reading: readingText,
      suggestions,
      nextQuestions,
      finalSummary,
      disclaimer,
    };
  } catch (error) {
    console.error('mapReadingData: Error processing reading data:', error);
    return null;
  }
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