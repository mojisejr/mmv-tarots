/*
  Warnings:

  - You are about to drop the column `omiseSourceId` on the `package_prices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[omisePriceId]` on the table `package_prices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'STRIPE';
ALTER TYPE "PaymentMethod" ADD VALUE 'MANUAL';

-- DropIndex
DROP INDEX "package_prices_omiseSourceId_key";

-- AlterTable
ALTER TABLE "package_prices" DROP COLUMN "omiseSourceId",
ADD COLUMN     "omisePriceId" TEXT,
ALTER COLUMN "stripePriceId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "package_prices_omisePriceId_key" ON "package_prices"("omisePriceId");
