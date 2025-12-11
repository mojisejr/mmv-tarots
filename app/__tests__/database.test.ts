import { PrismaClient } from '@prisma/client';
import { importCardsFromCSV } from '../../scripts/import-cards';

const prisma = new PrismaClient();

describe('Database Operations', () => {
  beforeAll(async () => {
    // Connect to test database or setup test environment
    // For now, we'll use the same database but clean up after tests
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Card Model', () => {
    beforeEach(async () => {
      // Clean up cards before each test
      await prisma.card.deleteMany();
    });

    it('should create a card with valid data', async () => {
      const card = await prisma.card.create({
        data: {
          cardId: 0,
          name: 'test_card',
          displayName: 'Test Card',
          arcana: 'Major Arcana',
          shortMeaning: 'Test meaning',
          longMeaning: 'Test long meaning',
          keywords: ['test', 'keyword'],
          imageUrl: 'https://example.com/image.png'
        }
      });

      expect(card).toBeDefined();
      expect(card.cardId).toBe(0);
      expect(card.name).toBe('test_card');
      expect(card.displayName).toBe('Test Card');
      expect(card.arcana).toBe('Major Arcana');
      expect(card.keywords).toEqual(['test', 'keyword']);
    });

    it('should enforce unique cardId', async () => {
      // Create first card
      await prisma.card.create({
        data: {
          cardId: 1,
          name: 'first_card',
          displayName: 'First Card',
          arcana: 'Major Arcana',
          keywords: []
        }
      });

      // Try to create second card with same cardId
      await expect(
        prisma.card.create({
          data: {
            cardId: 1,
            name: 'second_card',
            displayName: 'Second Card',
            arcana: 'Minor Arcana',
            keywords: []
          }
        })
      ).rejects.toThrow();
    });

    it('should allow null values for optional fields', async () => {
      const card = await prisma.card.create({
        data: {
          cardId: 2,
          name: 'minimal_card',
          displayName: 'Minimal Card',
          arcana: 'Wands',
          keywords: ['fire']
        }
      });

      expect(card.shortMeaning).toBeNull();
      expect(card.longMeaning).toBeNull();
      expect(card.imageUrl).toBeNull();
    });

    it('should store keywords as JSON', async () => {
      const keywords = ['courage', 'beginning', 'adventure'];
      const card = await prisma.card.create({
        data: {
          cardId: 3,
          name: 'the_fool',
          displayName: 'The Fool',
          arcana: 'Major Arcana',
          keywords
        }
      });

      expect(card.keywords).toEqual(keywords);
    });

    it('should retrieve cards by cardId', async () => {
      // Create test cards
      await prisma.card.createMany({
        data: [
          {
            cardId: 10,
            name: 'card_10',
            displayName: 'Card 10',
            arcana: 'Cups',
            keywords: ['water']
          },
          {
            cardId: 20,
            name: 'card_20',
            displayName: 'Card 20',
            arcana: 'Swords',
            keywords: ['air']
          }
        ]
      });

      // Retrieve specific card
      const card = await prisma.card.findUnique({
        where: { cardId: 10 }
      });

      expect(card).toBeDefined();
      expect(card?.displayName).toBe('Card 10');
      expect(card?.arcana).toBe('Cups');
    });

    it('should get cards by arcana type', async () => {
      // Create cards with different arcana types
      await prisma.card.createMany({
        data: [
          {
            cardId: 30,
            name: 'major_1',
            displayName: 'Major 1',
            arcana: 'Major Arcana',
            keywords: []
          },
          {
            cardId: 31,
            name: 'major_2',
            displayName: 'Major 2',
            arcana: 'Major Arcana',
            keywords: []
          },
          {
            cardId: 32,
            name: 'minor_1',
            displayName: 'Minor 1',
            arcana: 'Wands',
            keywords: []
          }
        ]
      });

      // Get only Major Arcana cards
      const majorCards = await prisma.card.findMany({
        where: { arcana: 'Major Arcana' },
        orderBy: { cardId: 'asc' }
      });

      expect(majorCards).toHaveLength(2);
      expect(majorCards[0].displayName).toBe('Major 1');
      expect(majorCards[1].displayName).toBe('Major 2');
    });
  });

  describe('CSV Import Functionality', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.card.deleteMany();
    });

    it('should import all 78 cards from CSV', async () => {
      const result = await importCardsFromCSV();

      expect(result.success).toBe(true);
      expect(result.imported).toBe(78);
      expect(result.errors).toHaveLength(0);

      // Verify all cards were imported
      const totalCards = await prisma.card.count();
      expect(totalCards).toBe(78);

      // Verify card IDs are in correct range
      const firstCard = await prisma.card.findFirst({
        orderBy: { cardId: 'asc' }
      });
      expect(firstCard?.cardId).toBe(0);

      const lastCard = await prisma.card.findFirst({
        orderBy: { cardId: 'desc' }
      });
      expect(lastCard?.cardId).toBe(77);
    });

    it('should parse keywords correctly', async () => {
      await importCardsFromCSV();

      // Check a card with known keywords
      const fool = await prisma.card.findUnique({
        where: { name: 'the_fool' }
      });

      expect(fool).toBeDefined();
      expect(fool?.keywords).toContain('เริ่มต้นใหม่');
      expect(fool?.keywords).toContain('ผจญภัย');
    });

    it('should handle duplicate imports gracefully', async () => {
      // Import first time
      const result1 = await importCardsFromCSV();
      expect(result1.success).toBe(true);

      // Import second time (should clear and re-import)
      const result2 = await importCardsFromCSV();
      expect(result2.success).toBe(true);

      // Should still have exactly 78 cards
      const totalCards = await prisma.card.count();
      expect(totalCards).toBe(78);
    });

    it('should preserve all card data fields', async () => {
      await importCardsFromCSV();

      // Check a random card has all required fields
      const card = await prisma.card.findFirst({
        where: { cardId: 0 }
      });

      expect(card).toBeDefined();
      expect(card?.name).toBeTruthy();
      expect(card?.displayName).toBeTruthy();
      expect(card?.arcana).toBeTruthy();
      expect(card?.imageUrl).toBeTruthy();
      expect(Array.isArray(card?.keywords)).toBe(true);
    });

    it('should validate card count for each arcana type', async () => {
      await importCardsFromCSV();

      // Count cards by arcana type
      const majorArcanaCount = await prisma.card.count({
        where: { arcana: 'Major Arcana' }
      });
      const wandsCount = await prisma.card.count({
        where: { arcana: 'Wands' }
      });
      const cupsCount = await prisma.card.count({
        where: { arcana: 'Cups' }
      });
      const swordsCount = await prisma.card.count({
        where: { arcana: 'Swords' }
      });
      const pentaclesCount = await prisma.card.count({
        where: { arcana: 'Pentacles' }
      });

      // Standard tarot deck has 22 Major Arcana and 56 Minor Arcana (14 each suit)
      expect(majorArcanaCount).toBe(22);
      expect(wandsCount).toBe(14);
      expect(cupsCount).toBe(14);
      expect(swordsCount).toBe(14);
      expect(pentaclesCount).toBe(14);

      // Total should be 78
      const total = majorArcanaCount + wandsCount + cupsCount + swordsCount + pentaclesCount;
      expect(total).toBe(78);
    });
  });
});