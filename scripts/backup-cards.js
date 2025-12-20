const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const cards = await prisma.card.findMany();
    fs.writeFileSync('prisma/cards_backup.json', JSON.stringify(cards, null, 2));
    console.log(`Backed up ${cards.length} cards to prisma/cards_backup.json`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
