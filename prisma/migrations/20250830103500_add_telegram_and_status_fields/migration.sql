-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "telegram" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex  
CREATE INDEX "users_telegram_idx" ON "users"("telegram");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_key" ON "users"("telegram");

-- Update existing users to have APPROVED status and empty telegram (will be updated manually)
UPDATE "users" SET "status" = 'APPROVED', "telegram" = '@admin_' || "id" WHERE "role" = 'ADMIN';
UPDATE "users" SET "status" = 'APPROVED', "telegram" = '@user_' || "id" WHERE "role" != 'ADMIN';
