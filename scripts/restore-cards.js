const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  const backupPath = path.join(__dirname, '../prisma/cards_backup.json');
  
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found!');
    return;
  }

  const cards = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log(`Found ${cards.length} cards in backup. Restoring...`);

  // Clear existing cards just in case
  await prisma.card.deleteMany();

  // Insert cards
  // Note: We use createMany if supported, or loop
  for (const card of cards) {
    await prisma.card.create({
      data: {
        cardId: card.cardId,
        name: card.name,
        displayName: card.displayName,
        arcana: card.arcana,
        shortMeaning: card.shortMeaning,
        longMeaning: card.longMeaning,
        keywords: card.keywords,
        imageUrl: card.imageUrl,
      }
    });
  }

  console.log('Restoration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
