-- AlterTable
ALTER TABLE "user" ADD COLUMN     "signup_ip" TEXT;

-- CreateTable
CREATE TABLE "referral_history" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardAmount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_history_referrer_id_idx" ON "referral_history"("referrer_id");

-- CreateIndex
CREATE INDEX "referral_history_referee_id_idx" ON "referral_history"("referee_id");

-- CreateIndex
CREATE INDEX "referral_history_ip_address_idx" ON "referral_history"("ip_address");

-- AddForeignKey
ALTER TABLE "referral_history" ADD CONSTRAINT "referral_history_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_history" ADD CONSTRAINT "referral_history_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
