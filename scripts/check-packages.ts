
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.starPackage.findMany();
  console.log(JSON.stringify(packages, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
