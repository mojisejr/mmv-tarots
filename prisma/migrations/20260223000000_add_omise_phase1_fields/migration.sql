-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'PROMPTPAY');

-- AlterTable
ALTER TABLE "credit_transactions"
ADD COLUMN "omiseChargeId" TEXT,
ADD COLUMN "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "package_prices"
ADD COLUMN "omiseSourceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_omiseChargeId_key" ON "credit_transactions"("omiseChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "package_prices_omiseSourceId_key" ON "package_prices"("omiseSourceId");
