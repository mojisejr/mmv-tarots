-- AlterTable
ALTER TABLE "user" ADD COLUMN     "referred_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
