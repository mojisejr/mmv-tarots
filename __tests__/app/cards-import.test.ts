import { PrismaClient } from '@prisma/client';
import { importCardsFromCSV } from '../../scripts/import-cards';

const prisma = new PrismaClient();

describe('Cards Import', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.card.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('CSV Import', () => {
    it('should import all 78 tarot cards from CSV', async () => {
      // Arrange - CSV file should exist with 78 cards

      // Act - Import cards
      const result = await importCardsFromCSV();

      // Assert - Check if import was successful
      expect(result.success).toBe(true);
      expect(result.imported).toBe(78);
      expect(result.errors).toHaveLength(0);
    });

    it('should have correct card_id mapping (0-77)', async () => {
      // Act - Import cards
      await importCardsFromCSV();

      // Assert - Check card_id range
      const cards = await prisma.card.findMany({
        orderBy: { cardId: 'asc' }
      });

      expect(cards).toHaveLength(78);
      expect(cards[0].cardId).toBe(0);
      expect(cards[77].cardId).toBe(77);
    });

    it('should parse keywords as JSON array', async () => {
      // Act - Import cards
      await importCardsFromCSV();

      // Assert - Check first card's keywords
      const firstCard = await prisma.card.findFirst({
        where: { cardId: 0 }
      });

      expect(firstCard).toBeTruthy();
      expect(firstCard?.keywords).toBeDefined();

      // Keywords should be a JSON array
      const keywords = firstCard?.keywords as any[];
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('should preserve all required fields', async () => {
      // Act - Import cards
      await importCardsFromCSV();

      // Assert - Check required fields for first card
      const card = await prisma.card.findFirst({
        where: { cardId: 0 }
      });

      expect(card).toMatchObject({
        cardId: 0,
        name: expect.any(String),
        displayName: expect.any(String),
        arcana: expect.any(String),
        imageUrl: expect.stringContaining('supabase.co')
      });
    });
  });

  describe('Card Model Operations', () => {
    beforeEach(async () => {
      // Import cards before each test
      await importCardsFromCSV();
    });

    it('should query cards by card_id array', async () => {
      // Arrange
      const selectedCardIds = [0, 15, 32];

      // Act
      const cards = await prisma.card.findMany({
        where: {
          cardId: {
            in: selectedCardIds
          }
        },
        orderBy: {
          cardId: 'asc'
        }
      });

      // Assert
      expect(cards).toHaveLength(3);
      expect(cards.map(c => c.cardId)).toEqual([0, 15, 32]);
    });

    it('should return card with all fields when queried', async () => {
      // Act
      const card = await prisma.card.findUnique({
        where: { cardId: 0 }
      });

      // Assert
      expect(card).toMatchObject({
        id: expect.any(Number),
        cardId: 0,
        name: expect.stringMatching(/^[a-z_]+$/),
        displayName: expect.any(String),
        arcana: expect.any(String),
        shortMeaning: expect.any(String),
        longMeaning: expect.any(String),
        keywords: expect.any(Array),
        imageUrl: expect.stringContaining('https://')
      });
    });
  });
});