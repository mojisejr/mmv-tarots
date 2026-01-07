
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PACKAGES = [
  {
    name: 'Starter',
    description: 'สำหรับผู้เริ่มต้น (10 Stars)',
    stars: 10,
    prices: [
      {
        amount: 99,
        stripePriceId: 'price_starter_reg_dummy',
        isPromo: false,
      },
      {
        amount: 49,
        stripePriceId: 'price_starter_promo_dummy',
        isPromo: true,
        promoLabel: 'First Time Only',
      },
    ],
  },
  {
    name: 'Standard',
    description: 'คุ้มค่าที่สุด (30 Stars)',
    stars: 30,
    prices: [
      {
        amount: 249,
        stripePriceId: 'price_standard_reg_dummy',
        isPromo: false,
      },
      {
        amount: 129,
        stripePriceId: 'price_standard_promo_dummy',
        isPromo: true,
        promoLabel: 'Best Value',
      },
    ],
  },
  {
    name: 'Premium',
    description: 'จัดเต็มสำหรับสายมู (60 Stars)',
    stars: 60,
    prices: [
      {
        amount: 399,
        stripePriceId: 'price_premium_reg_dummy',
        isPromo: false,
      },
      {
        amount: 199,
        stripePriceId: 'price_premium_promo_dummy',
        isPromo: true,
        promoLabel: 'Pro Choice',
      },
    ],
  },
];

async function main() {
  console.log('Seeding packages...');

  for (const pkg of PACKAGES) {
    const createdPkg = await prisma.starPackage.create({
      data: {
        name: pkg.name,
        description: pkg.description,
        stars: pkg.stars,
        prices: {
          create: pkg.prices.map((p) => ({
            amount: p.amount,
            stripePriceId: p.stripePriceId,
            isPromo: p.isPromo,
            promoLabel: p.promoLabel,
            currency: 'thb',
          })),
        },
      },
      include: {
        prices: true,
      },
    });
    console.log(`Created package: ${createdPkg.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
