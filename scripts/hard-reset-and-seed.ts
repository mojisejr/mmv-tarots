import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { encrypt } from '../lib/server/security/encryption';
import readline from 'readline';

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

const askConfirmation = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

async function main() {
  console.log('\n🚨 🚨 🚨 DANGER ZONE: HARD RESET & SEED 🚨 🚨 🚨');
  console.log('This script will WIPE ALL DATA including USERS, TRANSACTIONS, and HISTORY.');
  console.log('It will then re-seed the database with fresh Master Data.');
  
  const env = process.env.NODE_ENV || 'development';
  console.log(`Current Environment: ${env.toUpperCase()}`);

  if (env === 'production') {
    console.log('\n⚠️  YOU ARE IN PRODUCTION! ARE YOU ABSOLUTELY SURE?');
    const answer = await askConfirmation('Type "DESTROY PRODUCTION DATA" to continue: ');
    if (answer !== 'DESTROY PRODUCTION DATA') {
      console.log('❌ Operation aborted.');
      process.exit(0);
    }
  } else {
    const answer = await askConfirmation('Type "yes" to confirm hard reset: ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation aborted.');
      process.exit(0);
    }
  }

  console.log('\n🚀 Starting Hard Reset & Seeding...');

  // 1. Load Configuration
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found at: ${CONFIG_PATH}`);
  }
  const config: SeedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

  // 2. HARD RESET: Delete ALL Tables (Order Matters for Foreign Keys)
  console.log('🧹 WIPING DATABASE...');
  // Transaction & History
  await prisma.creditTransaction.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.referralHistory.deleteMany();
  await prisma.verification.deleteMany();
  
  // User & Account
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany(); // Cascades deletes related records usually, but manual is safer
  
  // Master Data
  await prisma.packagePrice.deleteMany();
  await prisma.starPackage.deleteMany();
  await prisma.suggestedQuestion.deleteMany();
  // NOTE: Preserving AgentConfig to keep tuned prompts safe
  // await prisma.agentConfig.deleteMany();
  await prisma.card.deleteMany();
  
  console.log('💀 Database is EMPTY (Agents Preserved).');

  // 3. Seed Cards
  console.log('🎴 Seeding Cards...');
  const cardData = fs.readFileSync(CARDS_CSV_PATH, 'utf-8');
  const cardLines = cardData.split('\n').filter((l) => l.trim()).slice(1);

  for (const line of cardLines) {
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
    // Explicit Check
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
      isActive: true,
    })),
  });
  console.log(`✅ Seeded ${config.suggestedQuestions.length} questions.`);

  console.log('\n✨ Hard Reset & Fresh Seeding Complete! Platform is ready for Launch. 🚀');
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
