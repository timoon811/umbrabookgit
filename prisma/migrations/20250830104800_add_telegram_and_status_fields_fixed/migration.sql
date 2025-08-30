-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "users" ADD COLUMN     "telegram" TEXT;

-- Update existing users to have APPROVED status and unique telegram
UPDATE "users" SET "status" = 'APPROVED', "telegram" = '@admin_' || "id" WHERE "role" = 'ADMIN';
UPDATE "users" SET "status" = 'APPROVED', "telegram" = '@user_' || "id" WHERE "role" != 'ADMIN';

-- Now make telegram NOT NULL and unique after setting values
ALTER TABLE "users" ALTER COLUMN "telegram" SET NOT NULL;

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex  
CREATE INDEX "users_telegram_idx" ON "users"("telegram");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_key" ON "users"("telegram");
