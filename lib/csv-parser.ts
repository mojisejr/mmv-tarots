import { readFileSync } from 'fs';
import { join } from 'path';
import { TarotCardData, CardValidationResult, ArcanaType } from '@/types/tarot';

/**
 * Parse CSV data into array of cards
 */
function parseCsvData(csvContent: string): TarotCardData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have header and at least one row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const cards: TarotCardData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields with commas
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    fields.push(current.trim());

    // Ensure we have all required fields
    while (fields.length < headers.length) {
      fields.push('');
    }

    // Parse keywords array from string like "[\"keyword1\",\"keyword2\"]"
    let keywords: string[] = [];
    try {
      const keywordsStr = fields[headers.indexOf('keywords')];
      if (keywordsStr && keywordsStr.startsWith('[') && keywordsStr.endsWith(']')) {
        keywords = JSON.parse(keywordsStr);
      }
    } catch (e) {
      keywords = [];
    }

    // Fix The Fool card ID bug - if empty, set to 0
    let id = parseInt(fields[headers.indexOf('id')] || '0', 10);
    const displayName = fields[headers.indexOf('displayName')] || '';

    // Special case: Fix The Fool card with empty ID
    if (displayName === 'The Fool' && isNaN(id)) {
      id = 0;
    }


    const card: TarotCardData = {
      id,
      name: fields[headers.indexOf('name')] || '',
      displayName,
      arcana: fields[headers.indexOf('arcana')] || '',
      shortMeaning: fields[headers.indexOf('shortMeaning')] || '',
      longMeaning: fields[headers.indexOf('longMeaning')] || '',
      longMeaningRaw: fields[headers.indexOf('longMeaningRaw')] || '',
      keywords,
      imageUrl: fields[headers.indexOf('imageUrl')] || ''
    };

    cards.push(card);
  }

  return cards;
}

/**
 * Parse card CSV file and return array of cards
 */
export async function parseCardCsv(filePath: string = 'docs/card.csv'): Promise<TarotCardData[]> {
  try {
    const fullPath = join(process.cwd(), filePath);
    const csvContent = readFileSync(fullPath, 'utf-8');
    return parseCsvData(csvContent);
  } catch (error) {
    throw new Error(`Failed to parse CSV file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that all cards have correct IDs (0-77) and no duplicates
 */
export function validateCardIds(cards: TarotCardData[]): CardValidationResult {
  const errors: CardValidationResult['errors'] = [];
  const duplicateIds: number[] = [];
  const missingIds: number[] = [];
  const foundIds = new Set<number>();

  // Check each card
  cards.forEach((card, index) => {
    const cardId = card.id;

    // Check for empty/invalid ID
    if (typeof cardId === 'string' || cardId === null || cardId === undefined) {
      errors.push({
        type: 'EMPTY_ID',
        cardName: card.displayName,
        message: `Card "${card.displayName}" has empty or invalid ID at index ${index}`
      });
      return;
    }

    // Check for invalid range
    if (typeof cardId === 'number' && (cardId < 0 || cardId > 77)) {
      errors.push({
        type: 'INVALID_RANGE',
        cardName: card.displayName,
        cardId,
        message: `Card "${card.displayName}" has ID ${cardId} which is outside valid range 0-77`
      });
    }

    // Check for duplicates
    if (typeof cardId === 'number' && foundIds.has(cardId)) {
      if (!duplicateIds.includes(cardId)) {
        duplicateIds.push(cardId);
      }
      errors.push({
        type: 'DUPLICATE_ID',
        cardName: card.displayName,
        cardId,
        message: `Card "${card.displayName}" has duplicate ID ${cardId}`
      });
    } else if (typeof cardId === 'number') {
      foundIds.add(cardId);
    }
  });

  // Find missing IDs
  for (let i = 0; i < 78; i++) {
    if (!foundIds.has(i)) {
      missingIds.push(i);
    }
  }

  const isValid = errors.length === 0 && duplicateIds.length === 0 && missingIds.length === 0;

  return {
    isValid,
    errors,
    missingIds,
    duplicateIds
  };
}

/**
 * Get a card by its ID (0-77)
 */
export async function getCardById(id: number): Promise<TarotCardData | undefined> {
  const cards = await parseCardCsv();
  return cards.find(card => card.id === id);
}

/**
 * Get all cards sorted by ID
 */
export async function getAllCards(): Promise<TarotCardData[]> {
  const cards = await parseCardCsv();
  return cards.sort((a, b) => {
    const aId = typeof a.id === 'number' ? a.id : 0;
    const bId = typeof b.id === 'number' ? b.id : 0;
    return aId - bId;
  });
}

/**
 * Get cards by arcana type
 */
export async function getCardsByArcana(arcana: string): Promise<TarotCardData[]> {
  const cards = await parseCardCsv();
  return cards.filter(card => card.arcana === arcana).sort((a, b) => {
    const aId = typeof a.id === 'number' ? a.id : 0;
    const bId = typeof b.id === 'number' ? b.id : 0;
    return aId - bId;
  });
}