-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'MEDIA_BUYER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ArticleType" AS ENUM ('PAGE', 'SECTION');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('CASH', 'WALLET', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."FinanceParticipantRole" AS ENUM ('BUYER', 'PROCESSOR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PayoutRuleRole" AS ENUM ('BUYER', 'PROCESSOR');

-- CreateEnum
CREATE TYPE "public"."PayoutRuleMode" AS ENUM ('SHARE', 'TIER_SHARE');

-- CreateEnum
CREATE TYPE "public"."HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS');

-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'RATING', 'SUGGESTION');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "telegram" TEXT,
    "company" TEXT,
    "website" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "registrationCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isWorkspace" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" "public"."ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "public"."ArticleType" NOT NULL DEFAULT 'PAGE',
    "parentId" TEXT,
    "categoryKey" TEXT NOT NULL,
    "tags" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "authorId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "articleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_endpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" "public"."HttpMethod" NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" TEXT,
    "responses" TEXT,
    "examples" TEXT,
    "version" TEXT NOT NULL DEFAULT 'v2',
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedbacks" (
    "id" TEXT NOT NULL,
    "type" "public"."FeedbackType" NOT NULL,
    "message" TEXT,
    "rating" INTEGER,
    "articleId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_queries" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "data" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AccountType" NOT NULL DEFAULT 'OTHER',
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL DEFAULT 'EXPENSE',
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectKey" TEXT,
    "projectId" TEXT,
    "userId" TEXT,
    "role" "public"."FinanceParticipantRole",
    "categoryId" TEXT,
    "relatedId" TEXT,

    CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "public"."TransactionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_payout_rules" (
    "id" TEXT NOT NULL,
    "projectKey" TEXT,
    "projectId" TEXT,
    "role" "public"."PayoutRuleRole" NOT NULL,
    "mode" "public"."PayoutRuleMode" NOT NULL DEFAULT 'SHARE',
    "percent" DECIMAL(65,30),
    "tiers" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_payout_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance_projects" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_apiKey_key" ON "public"."users"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "categories_key_key" ON "public"."categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "public"."articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "api_endpoints_method_path_version_key" ON "public"."api_endpoints"("method", "path", "version");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "public"."site_settings"("key");

-- CreateIndex
CREATE INDEX "finance_transactions_occurredAt_idx" ON "public"."finance_transactions"("occurredAt");

-- CreateIndex
CREATE INDEX "finance_transactions_type_idx" ON "public"."finance_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "finance_categories_code_key" ON "public"."finance_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "finance_projects_key_key" ON "public"."finance_projects"("key");

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_categoryKey_fkey" FOREIGN KEY ("categoryKey") REFERENCES "public"."categories"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedbacks" ADD CONSTRAINT "feedbacks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics" ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."finance_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_projectKey_fkey" FOREIGN KEY ("projectKey") REFERENCES "public"."categories"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."finance_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_payout_rules" ADD CONSTRAINT "finance_payout_rules_projectKey_fkey" FOREIGN KEY ("projectKey") REFERENCES "public"."categories"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance_payout_rules" ADD CONSTRAINT "finance_payout_rules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."finance_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
