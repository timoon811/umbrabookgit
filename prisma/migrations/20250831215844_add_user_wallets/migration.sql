-- CreateTable
CREATE TABLE "public"."user_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_wallets_userId_idx" ON "public"."user_wallets"("userId");

-- CreateIndex
CREATE INDEX "user_wallets_network_idx" ON "public"."user_wallets"("network");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_userId_network_key" ON "public"."user_wallets"("userId", "network");

-- AddForeignKey
ALTER TABLE "public"."user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
