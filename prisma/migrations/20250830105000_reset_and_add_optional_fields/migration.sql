-- Reset failed migration state
DELETE FROM "_prisma_migrations" WHERE migration_name = '20250830103500_add_telegram_and_status_fields';

-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
    ALTER TABLE "users" ADD COLUMN "status" "UserStatus" DEFAULT 'PENDING';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telegram') THEN
    ALTER TABLE "users" ADD COLUMN "telegram" TEXT;
  END IF;
END $$;

-- Update existing users to have APPROVED status
UPDATE "users" SET "status" = 'APPROVED' WHERE "status" IS NULL;
UPDATE "users" SET "telegram" = '@user_' || "id" WHERE "telegram" IS NULL;

-- Create indexes if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_status_idx') THEN
    CREATE INDEX "users_status_idx" ON "users"("status");
  END IF;
END $$;
