/*
  Warnings:

  - You are about to drop the column `points` on the `user` table. All the data in the column will be lost.
  - The `emailVerified` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "account" ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "points",
ADD COLUMN     "stars" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
