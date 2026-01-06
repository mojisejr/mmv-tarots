/*
  Warnings:

  - You are about to drop the column `price` on the `star_packages` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `star_packages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "star_packages" DROP COLUMN "price",
DROP COLUMN "stripePriceId";

-- CreateTable
CREATE TABLE "package_prices" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'thb',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isPromo" BOOLEAN NOT NULL DEFAULT false,
    "promoLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_prices_stripePriceId_key" ON "package_prices"("stripePriceId");

-- AddForeignKey
ALTER TABLE "package_prices" ADD CONSTRAINT "package_prices_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "star_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
