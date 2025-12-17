import { describe, it, expect } from 'vitest';
import { parseCardCsv, getCardById, getAllCards, validateCardIds } from '../csv-parser';

describe('CSV Parser', () => {
  describe('parseCardCsv', () => {
    it('should parse the CSV file correctly', async () => {
      const cards = await parseCardCsv();

      expect(cards).toBeDefined();
      expect(cards.length).toBe(78);
    });

    it('should throw error if CSV file is missing', async () => {
      // This test will fail because we're reading from existing file
      await expect(parseCardCsv('/nonexistent/file.csv')).rejects.toThrow();
    });
  });

  describe('validateCardIds', () => {
    it('should validate that all 78 cards have correct IDs 0-77', async () => {
      const cards = await parseCardCsv();
      const validation = validateCardIds(cards);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.missingIds).toHaveLength(0);
      expect(validation.duplicateIds).toHaveLength(0);
    });

    it('should ensure The Fool card has ID 0', async () => {
      const cards = await parseCardCsv();
      const foolCard = cards.find(card => card.displayName === 'The Fool');

      expect(foolCard).toBeDefined();
      expect(foolCard!.id).toBe(0);
    });
  });

  describe('getCardById', () => {
    it('should return The Fool card with ID 0', async () => {
      const card = await getCardById(0);

      expect(card).toBeDefined();
      expect(card?.name).toBe('the_fool');
      expect(card?.displayName).toBe('The Fool');
      expect(card?.id).toBe(0);
    });

    it('should return correct card for known IDs', async () => {
      const magician = await getCardById(1);
      expect(magician?.name).toBe('the_magician');

      const sun = await getCardById(19);
      expect(sun?.name).toBe('the_sun');
    });

    it('should return undefined for invalid ID', async () => {
      const card = await getCardById(999);
      expect(card).toBeUndefined();
    });
  });

  describe('getAllCards', () => {
    it('should return all 78 cards sorted by ID', async () => {
      const cards = await getAllCards();

      expect(cards).toHaveLength(78);
      expect(cards[0].id).toBe(0);
      expect(cards[77].id).toBe(77);

      // Verify all IDs are present and sequential
      for (let i = 0; i < 78; i++) {
        expect(cards[i].id).toBe(i);
      }
    });
  });
});