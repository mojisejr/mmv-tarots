import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface CardCSVRow {
  id: string;
  name: string;
  displayName: string;
  arcana: string;
  shortMeaning: string;
  longMeaning: string;
  longMeaningRaw: string;
  keywords: string;
  imageUrl: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

/**
 * Parse keywords from CSV format to JSON array
 * Format: "["keyword1,keyword2" → ["keyword1", "keyword2"]
 */
function parseKeywords(keywordsStr: string): string[] {
  if (!keywordsStr || keywordsStr === '""' || keywordsStr === '') return [];

  // Handle case like "["เริ่มต้นใหม่,ผจญภัย""
  let cleaned = keywordsStr
    .replace(/^\["/, '')
    .replace(/"\]$/, '')
    .replace(/",/g, ',')
    .replace(/^"/, '')
    .replace(/"$/, '');

  // Split by comma and clean each keyword
  return cleaned ? cleaned.split(',').map(k => k.trim()).filter(k => k) : [];
}

/**
 * Import all tarot cards from CSV file
 */
export async function importCardsFromCSV(): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    errors: []
  };

  try {
    console.log('Starting card import process...');

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'docs', 'card.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV - handle complex CSV with quotes
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');

    console.log(`Found ${lines.length - 1} cards in CSV`);

    // Clear existing cards
    const existingCount = await prisma.card.count();
    if (existingCount > 0) {
      console.log(`Clearing ${existingCount} existing cards...`);
      await prisma.card.deleteMany();
    }

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV row handling quoted fields with commas
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          const prevChar = j > 0 ? line[j - 1] : '';

          if (char === '"' && prevChar !== '\\') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        if (values.length < 9) {
          result.errors.push(`Row ${i}: Invalid column count (got ${values.length}, expected 9)`);
          continue;
        }

        const row: CardCSVRow = {
          id: values[0],
          name: values[1],
          displayName: values[2],
          arcana: values[3],
          shortMeaning: values[4],
          longMeaning: values[5],
          longMeaningRaw: values[6],
          keywords: values[7],
          imageUrl: values[8]
        };

        // Map CSV ID (0-77) to card_id (0-77) - CSV already has correct IDs
        const cardId = parseInt(row.id);

        // Validate card_id range
        if (isNaN(cardId) || cardId < 0 || cardId > 77) {
          result.errors.push(`Row ${i}: Invalid card_id ${cardId} (expected 0-77)`);
          continue;
        }

        // Parse keywords from string to JSON array
        const keywords = parseKeywords(row.keywords);

        // Create card
        await prisma.card.create({
          data: {
            cardId: cardId,
            name: row.name,
            displayName: row.displayName,
            arcana: row.arcana,
            shortMeaning: row.shortMeaning || null,
            longMeaning: row.longMeaning || null,
            keywords: keywords,
            imageUrl: row.imageUrl || null
          }
        });

        result.imported++;
        console.log(`Imported card ${cardId}: ${row.displayName}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Row ${i}: ${errorMessage}`);
      }
    }

    result.success = result.errors.length === 0;

    // Verify import
    const totalCount = await prisma.card.count();
    console.log(`\nImport complete! Total cards in database: ${totalCount}`);

    // Show a few cards as verification
    const sampleCards = await prisma.card.findMany({
      take: 5,
      orderBy: { cardId: 'asc' }
    });

    console.log('\nSample cards:');
    sampleCards.forEach(card => {
      console.log(`- [${card.cardId}] ${card.displayName} (${card.arcana})`);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Failed to import: ${errorMessage}`);
  }

  return result;
}

// CLI execution - only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importCardsFromCSV()
    .then((result) => {
      console.log('Import completed:');
      console.log(`- Success: ${result.success}`);
      console.log(`- Imported: ${result.imported} cards`);
      console.log(`- Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }

      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}