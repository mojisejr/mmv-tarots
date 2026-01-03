-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "encrypted_prompt" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_slug_key" ON "agent_configs"("slug");
