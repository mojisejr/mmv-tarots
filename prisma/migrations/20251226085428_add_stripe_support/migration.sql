/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `credit_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "credit_transactions" ADD COLUMN     "stripeSessionId" TEXT;

-- CreateTable
CREATE TABLE "star_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stars" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stripePriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "star_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_stripeSessionId_key" ON "credit_transactions"("stripeSessionId");
