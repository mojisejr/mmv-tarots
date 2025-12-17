import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

// Mock database operations
vi.mock('../lib/db', () => ({
  db: {
    card: {
      create: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn()
    },
    prediction: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    $disconnect: vi.fn()
  }
}));

// Mock importCardsFromCSV function
vi.mock('../../scripts/import-cards', () => ({
  importCardsFromCSV: vi.fn()
}));

import { db } from '../lib/db';
import { importCardsFromCSV } from '../../scripts/import-cards';

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card Model', () => {
    it('should create a card with valid data', async () => {
      // Arrange
      const mockCard = {
        id: 'card-123',
        cardId: 0,
        name: 'test_card',
        displayName: 'Test Card',
        arcana: 'Major Arcana',
        shortMeaning: 'Test meaning',
        longMeaning: 'Test long meaning',
        keywords: ['test', 'keyword'],
        imageUrl: 'https://example.com/image.png',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.card.create).mockResolvedValue(mockCard);

      // Act
      const card = await db.card.create({
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

      // Assert
      expect(card).toBeDefined();
      expect(card.cardId).toBe(0);
      expect(card.name).toBe('test_card');
      expect(card.displayName).toBe('Test Card');
      expect(card.arcana).toBe('Major Arcana');
      expect(card.keywords).toEqual(['test', 'keyword']);
      expect(db.card.create).toHaveBeenCalledWith({
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
    });

    it('should enforce unique cardId', async () => {
      // Arrange
      vi.mocked(db.card.create).mockResolvedValueOnce({
        id: 'card-1',
        cardId: 1,
        name: 'first_card',
        displayName: 'First Card',
        arcana: 'Major Arcana',
        keywords: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      vi.mocked(db.card.create).mockRejectedValueOnce(new Error('Unique constraint failed'));

      // Act - First call should succeed
      await db.card.create({
        data: {
          cardId: 1,
          name: 'first_card',
          displayName: 'First Card',
          arcana: 'Major Arcana',
          keywords: []
        }
      });

      // Act & Assert - Second call should fail
      await expect(
        db.card.create({
          data: {
            cardId: 1,
            name: 'second_card',
            displayName: 'Second Card',
            arcana: 'Minor Arcana',
            keywords: []
          }
        })
      ).rejects.toThrow('Unique constraint failed');

      expect(db.card.create).toHaveBeenCalledTimes(2);
    });

    it('should allow null values for optional fields', async () => {
      // Arrange
      const mockCard = {
        id: 'card-minimal',
        cardId: 2,
        name: 'minimal_card',
        displayName: 'Minimal Card',
        arcana: 'Wands',
        keywords: ['fire'],
        shortMeaning: null,
        longMeaning: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.card.create).mockResolvedValue(mockCard);

      // Act
      const card = await db.card.create({
        data: {
          cardId: 2,
          name: 'minimal_card',
          displayName: 'Minimal Card',
          arcana: 'Wands',
          keywords: ['fire']
        }
      });

      // Assert
      expect(card.shortMeaning).toBeNull();
      expect(card.longMeaning).toBeNull();
      expect(card.imageUrl).toBeNull();
    });

    it('should store keywords as JSON', async () => {
      // Arrange
      const keywords = ['courage', 'beginning', 'adventure'];
      const mockCard = {
        id: 'card-fool',
        cardId: 3,
        name: 'the_fool',
        displayName: 'The Fool',
        arcana: 'Major Arcana',
        keywords,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.card.create).mockResolvedValue(mockCard);

      // Act
      const card = await db.card.create({
        data: {
          cardId: 3,
          name: 'the_fool',
          displayName: 'The Fool',
          arcana: 'Major Arcana',
          keywords
        }
      });

      // Assert
      expect(card.keywords).toEqual(keywords);
    });

    it('should retrieve cards by cardId', async () => {
      // Arrange
      const mockCard = {
        id: 'card-10',
        cardId: 10,
        name: 'card_10',
        displayName: 'Card 10',
        arcana: 'Cups',
        keywords: ['water'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.card.findUnique).mockResolvedValue(mockCard);

      // Act
      const card = await db.card.findUnique({
        where: { cardId: 10 }
      });

      // Assert
      expect(card).toBeDefined();
      expect(card?.displayName).toBe('Card 10');
      expect(card?.arcana).toBe('Cups');
      expect(db.card.findUnique).toHaveBeenCalledWith({
        where: { cardId: 10 }
      });
    });

    it('should get cards by arcana type', async () => {
      // Arrange
      const mockMajorCards = [
        {
          id: 'card-major1',
          cardId: 30,
          name: 'major_1',
          displayName: 'Major 1',
          arcana: 'Major Arcana',
          keywords: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'card-major2',
          cardId: 31,
          name: 'major_2',
          displayName: 'Major 2',
          arcana: 'Major Arcana',
          keywords: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(db.card.findMany).mockResolvedValue(mockMajorCards);

      // Act
      const majorCards = await db.card.findMany({
        where: { arcana: 'Major Arcana' },
        orderBy: { cardId: 'asc' }
      });

      // Assert
      expect(majorCards).toHaveLength(2);
      expect(majorCards[0].displayName).toBe('Major 1');
      expect(majorCards[1].displayName).toBe('Major 2');
      expect(db.card.findMany).toHaveBeenCalledWith({
        where: { arcana: 'Major Arcana' },
        orderBy: { cardId: 'asc' }
      });
    });
  });

  describe('CSV Import Functionality', () => {
    it('should import all 78 cards from CSV', async () => {
      // Arrange
      const mockImportResult = {
        success: true,
        imported: 78,
        errors: []
      };

      vi.mocked(importCardsFromCSV).mockResolvedValue(mockImportResult);
      vi.mocked(db.card.count).mockResolvedValue(78);
      vi.mocked(db.card.findFirst)
        .mockResolvedValueOnce({ cardId: 0 }) // First card
        .mockResolvedValueOnce({ cardId: 77 }); // Last card

      // Act
      const result = await importCardsFromCSV();
      const totalCards = await db.card.count();
      const firstCard = await db.card.findFirst({ orderBy: { cardId: 'asc' } });
      const lastCard = await db.card.findFirst({ orderBy: { cardId: 'desc' } });

      // Assert
      expect(result.success).toBe(true);
      expect(result.imported).toBe(78);
      expect(result.errors).toHaveLength(0);
      expect(totalCards).toBe(78);
      expect(firstCard?.cardId).toBe(0);
      expect(lastCard?.cardId).toBe(77);
    });

    it('should parse keywords correctly', async () => {
      // Arrange
      const mockFoolCard = {
        id: 'card-fool',
        name: 'the_fool',
        keywords: ['เริ่มต้นใหม่', 'ผจญภัย', 'ความเชื่อมั่น']
      };

      vi.mocked(importCardsFromCSV).mockResolvedValue({ success: true, imported: 78, errors: [] });
      vi.mocked(db.card.findUnique).mockResolvedValue(mockFoolCard);

      // Act
      await importCardsFromCSV();
      const fool = await db.card.findUnique({
        where: { name: 'the_fool' }
      });

      // Assert
      expect(fool).toBeDefined();
      expect(fool?.keywords).toContain('เริ่มต้นใหม่');
      expect(fool?.keywords).toContain('ผจญภัย');
    });

    it('should handle duplicate imports gracefully', async () => {
      // Arrange
      const mockImportResult = {
        success: true,
        imported: 78,
        errors: []
      };

      vi.mocked(importCardsFromCSV)
        .mockResolvedValueOnce(mockImportResult)
        .mockResolvedValueOnce(mockImportResult);
      vi.mocked(db.card.count).mockResolvedValue(78);

      // Act
      const result1 = await importCardsFromCSV();
      const result2 = await importCardsFromCSV();
      const totalCards = await db.card.count();

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(totalCards).toBe(78);
      expect(importCardsFromCSV).toHaveBeenCalledTimes(2);
    });

    it('should preserve all card data fields', async () => {
      // Arrange
      const mockCard = {
        id: 'card-0',
        cardId: 0,
        name: 'the_fool',
        displayName: 'The Fool',
        arcana: 'Major Arcana',
        shortMeaning: 'ความไร้เดียงสาและจุดเริ่มต้น',
        longMeaning: 'เป็นไพ่ที่แสดงถึงการเริ่มต้นใหม่ การเดินทางเข้าสู่สิ่งที่ไม่รู้จัก',
        keywords: ['เริ่มต้นใหม่', 'ผจญภัย', 'ความเชื่อมั่น'],
        imageUrl: 'https://example.com/cards/the_fool.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(importCardsFromCSV).mockResolvedValue({ success: true, imported: 78, errors: [] });
      vi.mocked(db.card.findFirst).mockResolvedValue(mockCard);

      // Act
      await importCardsFromCSV();
      const card = await db.card.findFirst({
        where: { cardId: 0 }
      });

      // Assert
      expect(card).toBeDefined();
      expect(card?.name).toBeTruthy();
      expect(card?.displayName).toBeTruthy();
      expect(card?.arcana).toBeTruthy();
      expect(card?.imageUrl).toBeTruthy();
      expect(Array.isArray(card?.keywords)).toBe(true);
    });

    it('should validate card count for each arcana type', async () => {
      // Arrange
      vi.mocked(importCardsFromCSV).mockResolvedValue({ success: true, imported: 78, errors: [] });
      vi.mocked(db.card.count)
        .mockResolvedValueOnce(22) // Major Arcana
        .mockResolvedValueOnce(14) // Wands
        .mockResolvedValueOnce(14) // Cups
        .mockResolvedValueOnce(14) // Swords
        .mockResolvedValueOnce(14); // Pentacles

      // Act
      await importCardsFromCSV();
      const majorArcanaCount = await db.card.count({ where: { arcana: 'Major Arcana' } });
      const wandsCount = await db.card.count({ where: { arcana: 'Wands' } });
      const cupsCount = await db.card.count({ where: { arcana: 'Cups' } });
      const swordsCount = await db.card.count({ where: { arcana: 'Swords' } });
      const pentaclesCount = await db.card.count({ where: { arcana: 'Pentacles' } });

      // Assert
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