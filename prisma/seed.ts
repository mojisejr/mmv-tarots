import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { encrypt } from '../lib/server/security/encryption';

const prisma = new PrismaClient();

// Configuration
const CONFIG_PATH = path.join(process.cwd(), '.tmp', 'master-seed-config.json');
const CARDS_CSV_PATH = path.join(process.cwd(), 'docs', 'card.csv');
const PROMPTS_DIR = path.join(process.cwd(), 'lib', 'server', 'ai', 'prompts');

interface SeedConfig {
  packages: Array<{
    name: string;
    description: string;
    stars: number;
    prices: Array<{
      stripePriceId: string;
      amount: number;
      isPromo: boolean;
      promoLabel: string | null;
    }>;
  }>;
  suggestedQuestions: Array<{
    text: string;
    category: string;
  }>;
}

// Helper: Parse Keywords from CSV
function parseKeywords(keywordsStr: string): string[] {
  if (!keywordsStr || keywordsStr === '""' || keywordsStr === '') return [];
  let cleaned = keywordsStr
    .replace(/^\["/, '')
    .replace(/"\]$/, '')
    .replace(/",/g, ',')
    .replace(/^"/, '')
    .replace(/"$/, '');
  return cleaned ? cleaned.split(',').map((k) => k.trim()).filter((k) => k) : [];
}

async function main() {
  console.log('🚀 Starting Unified Master Seeding...');

  // 1. Load Configuration
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found at: ${CONFIG_PATH}`);
  }
  const config: SeedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

  // 2. Clear Master Data (Safe Mode - No User Data Touched)
  console.log('🧹 Cleaning up master data...');
  await prisma.suggestedQuestion.deleteMany();
  // NOTE: We do NOT delete agentConfig to preserve manually tuned prompts/versions
  // await prisma.agentConfig.deleteMany(); 
  await prisma.packagePrice.deleteMany();
  await prisma.starPackage.deleteMany();
  await prisma.card.deleteMany(); // Cards need to be re-synced from CSV
  console.log('✅ Master data cleaned (AgentConfigs preserved).');

  // 3. Seed Cards
  console.log('🎴 Seeding Cards...');
  const cardData = fs.readFileSync(CARDS_CSV_PATH, 'utf-8');
  const cardLines = cardData.split('\n').filter((l) => l.trim()).slice(1); // Skip header

  for (const line of cardLines) {
    // Simple CSV parser logic (adjust if CSV is complex with line breaks)
    // Assuming standard CSV format from import-cards.ts logic
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

    if (values.length >= 9) {
       await prisma.card.create({
        data: {
          cardId: parseInt(values[0]),
          name: values[1],
          displayName: values[2],
          arcana: values[3],
          shortMeaning: values[4] || null,
          longMeaning: values[5] || null,
          keywords: parseKeywords(values[7]),
          imageUrl: values[8] || null,
        },
      });
    }
  }
  console.log(`✅ Seeded ${cardLines.length} cards.`);
  // 4. Seed Agents (Encrypted) - Create Only (Safe Mode)
  console.log('🤖 Seeding Agents (Create Only)...');
  const agents = ['gatekeeper', 'analyst', 'mystic'];
  for (const slug of agents) {
    // Check if exists first
    const existing = await prisma.agentConfig.findUnique({ where: { slug } });
    
    if (existing) {
      console.log(`   - Skipped ${slug} (Already exists)`);
      continue;
    }

    const promptPath = path.join(PROMPTS_DIR, `${slug}.ts`);
    if (fs.existsSync(promptPath)) {
      const content = fs.readFileSync(promptPath, 'utf-8');
      const encrypted = encrypt(content);
      
      await prisma.agentConfig.create({
        data: {
          slug,
          encryptedPrompt: encrypted,
          isActive: true,
          version: 1,
        },
      });
      console.log(`   - Created ${slug} (Encrypted)`);
    } else {
      console.warn(`   ⚠️ Prompt file for ${slug} not found!`);
    }
  }

  // 5. Seed Packages & Prices
  console.log('📦 Seeding Packages...');
  for (const pkg of config.packages) {
    await prisma.starPackage.create({
      data: {
        name: pkg.name,
        description: pkg.description,
        stars: pkg.stars,
        prices: {
          create: pkg.prices.map((p) => ({
             stripePriceId: p.stripePriceId,
             amount: p.amount,
             isPromo: p.isPromo,
             promoLabel: p.promoLabel,
             currency: 'thb',
          })),
        },
      },
    });
    console.log(`   - Created ${pkg.name}`);
  }

  // 6. Seed Suggested Questions
  console.log('💡 Seeding Suggested Questions...');
  await prisma.suggestedQuestion.createMany({
    data: config.suggestedQuestions.map((q) => ({
      text: q.text,
      category: q.category,
      isActive: true, // Default to true
    })),
  });
  console.log(`✅ Seeded ${config.suggestedQuestions.length} questions.`);

  console.log('✨ Unified Master Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
