-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "arcana" TEXT NOT NULL,
    "short_meaning" TEXT,
    "long_meaning" TEXT,
    "keywords" JSONB NOT NULL,
    "image_url" TEXT,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_card_id_key" ON "cards"("card_id");