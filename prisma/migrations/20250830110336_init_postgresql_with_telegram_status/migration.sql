-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'MEDIA_BUYER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telegram" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "blocks" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documentation_sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentation_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documentation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "blocks" TEXT,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cryptocurrencies" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_counterparties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CLIENT',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "bankDetails" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_counterparties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "counterpartyId" TEXT,
    "categoryId" TEXT,
    "projectId" TEXT,
    "projectKey" TEXT,
    "type" "public"."TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deposit_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deposits" (
    "id" TEXT NOT NULL,
    "depositSourceId" TEXT NOT NULL,
    "mammothId" TEXT NOT NULL,
    "mammothLogin" TEXT NOT NULL,
    "mammothCountry" TEXT NOT NULL,
    "mammothPromo" TEXT,
    "token" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "commissionPercent" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmountUsd" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "netAmountUsd" DOUBLE PRECISION NOT NULL,
    "workerPercent" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "txHash" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_key" ON "public"."users"("telegram");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status");

-- CreateIndex
CREATE INDEX "users_telegram_idx" ON "public"."users"("telegram");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "public"."courses"("slug");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "public"."courses"("slug");

-- CreateIndex
CREATE INDEX "courses_isPublished_idx" ON "public"."courses"("isPublished");

-- CreateIndex
CREATE INDEX "courses_category_idx" ON "public"."courses"("category");

-- CreateIndex
CREATE UNIQUE INDEX "documentation_sections_key_key" ON "public"."documentation_sections"("key");

-- CreateIndex
CREATE UNIQUE INDEX "documentation_slug_key" ON "public"."documentation"("slug");

-- CreateIndex
CREATE INDEX "finance_transactions_accountId_idx" ON "public"."finance_transactions"("accountId");

-- CreateIndex
CREATE INDEX "finance_transactions_categoryId_idx" ON "public"."finance_transactions"("categoryId");

-- CreateIndex
CREATE INDEX "finance_transactions_projectId_idx" ON "public"."finance_transactions"("projectId");

-- CreateIndex
CREATE INDEX "finance_transactions_projectKey_idx" ON "public"."finance_transactions"("projectKey");

-- CreateIndex
CREATE INDEX "finance_transactions_date_idx" ON "public"."finance_transactions"("date");

-- CreateIndex
CREATE INDEX "finance_transactions_type_idx" ON "public"."finance_transactions"("type");

-- CreateIndex
CREATE INDEX "deposit_sources_projectId_idx" ON "public"."deposit_sources"("projectId");

-- CreateIndex
CREATE INDEX "deposit_sources_isActive_idx" ON "public"."deposit_sources"("isActive");

-- CreateIndex
CREATE INDEX "deposits_depositSourceId_idx" ON "public"."deposits"("depositSourceId");

-- CreateIndex
CREATE INDEX "deposits_mammothId_idx" ON "public"."deposits"("mammothId");

-- CreateIndex
CREATE INDEX "deposits_createdAt_idx" ON "public"."deposits"("createdAt");

-- CreateIndex
CREATE INDEX "deposits_processed_idx" ON "public"."deposits"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_id_depositSourceId_key" ON "public"."deposits"("id", "depositSourceId");

-- CreateIndex
CREATE INDEX "analytics_userId_idx" ON "public"."analytics"("userId");

-- CreateIndex
CREATE INDEX "analytics_action_idx" ON "public"."analytics"("action");

-- CreateIndex
CREATE INDEX "analytics_createdAt_idx" ON "public"."analytics"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "public"."articles"("slug");

-- CreateIndex
CREATE INDEX "articles_slug_idx" ON "public"."articles"("slug");

-- CreateIndex
CREATE INDEX "articles_category_idx" ON "public"."articles"("category");

-- CreateIndex
CREATE INDEX "articles_isPublished_idx" ON "public"."articles"("isPublished");

-- AddForeignKey
ALTER TABLE "public"."course_sections" ADD CONSTRAINT "course_sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_pages" ADD CONSTRAINT "course_pages_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentation" ADD CONSTRAINT "documentation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."documentation_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documentation" ADD CONSTRAINT "documentation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."documentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."finance_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "public"."finance_counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposit_sources" ADD CONSTRAINT "deposit_sources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."finance_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposits" ADD CONSTRAINT "deposits_depositSourceId_fkey" FOREIGN KEY ("depositSourceId") REFERENCES "public"."deposit_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
