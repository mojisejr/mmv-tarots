const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const packages = [
  {
    name: 'Starter Pack',
    description: 'เหมาะสำหรับผู้เริ่มต้น ลองดูดวงครั้งแรก',
    stars: 5,
    amount: 49.0,
    active: true,
  },
  {
    name: 'Popular Pack',
    description: 'ยอดนิยม! คุ้มค่าที่สุดสำหรับการดูดวงต่อเนื่อง',
    stars: 20,
    amount: 149.0,
    active: true,
  },
  {
    name: 'Pro Pack',
    description: 'สำหรับผู้ที่ต้องการคำทำนายเจาะลึก',
    stars: 50,
    amount: 299.0,
    active: true,
  },
];

async function main() {
  console.log('🌟 Seeding StarPackages...');

  for (const pkg of packages) {
    const created = await prisma.starPackage.create({
      data: {
        name: pkg.name,
        description: pkg.description,
        stars: pkg.stars,
        active: pkg.active,
        prices: {
          create: {
            amount: pkg.amount,
            currency: 'thb',
            active: true,
            isPromo: false,
          },
        },
      },
    });
    console.log(`✅ Created: ${created.name} (${created.stars} stars)`);
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
