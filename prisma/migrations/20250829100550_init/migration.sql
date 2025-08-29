-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "telegram" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "course_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "blocks" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_pages_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentation_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📄',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "documentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "blocks" TEXT,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documentation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "documentation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documentation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "documentation_sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finance_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "balance" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "cryptocurrencies" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "finance_counterparties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CLIENT',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "bankDetails" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "finance_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "finance_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" REAL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "finance_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "counterpartyId" TEXT,
    "categoryId" TEXT,
    "projectId" TEXT,
    "projectKey" TEXT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "commissionPercent" REAL NOT NULL DEFAULT 0,
    "commissionAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL,
    "originalAmount" REAL NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "finance_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "finance_transactions_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "finance_counterparties" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finance_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "finance_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finance_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "finance_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deposit_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "commission" REAL NOT NULL DEFAULT 20.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "deposit_sources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "finance_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "depositSourceId" TEXT NOT NULL,
    "mammothId" TEXT NOT NULL,
    "mammothLogin" TEXT NOT NULL,
    "mammothCountry" TEXT NOT NULL,
    "mammothPromo" TEXT,
    "token" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "amountUsd" REAL NOT NULL,
    "commissionPercent" REAL NOT NULL,
    "commissionAmount" REAL NOT NULL,
    "commissionAmountUsd" REAL NOT NULL,
    "netAmount" REAL NOT NULL,
    "netAmountUsd" REAL NOT NULL,
    "workerPercent" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "txHash" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deposits_depositSourceId_fkey" FOREIGN KEY ("depositSourceId") REFERENCES "deposit_sources" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_isPublished_idx" ON "courses"("isPublished");

-- CreateIndex
CREATE INDEX "courses_category_idx" ON "courses"("category");

-- CreateIndex
CREATE UNIQUE INDEX "documentation_sections_key_key" ON "documentation_sections"("key");

-- CreateIndex
CREATE UNIQUE INDEX "documentation_slug_key" ON "documentation"("slug");

-- CreateIndex
CREATE INDEX "finance_transactions_accountId_idx" ON "finance_transactions"("accountId");

-- CreateIndex
CREATE INDEX "finance_transactions_categoryId_idx" ON "finance_transactions"("categoryId");

-- CreateIndex
CREATE INDEX "finance_transactions_projectId_idx" ON "finance_transactions"("projectId");

-- CreateIndex
CREATE INDEX "finance_transactions_projectKey_idx" ON "finance_transactions"("projectKey");

-- CreateIndex
CREATE INDEX "finance_transactions_date_idx" ON "finance_transactions"("date");

-- CreateIndex
CREATE INDEX "finance_transactions_type_idx" ON "finance_transactions"("type");

-- CreateIndex
CREATE INDEX "deposit_sources_projectId_idx" ON "deposit_sources"("projectId");

-- CreateIndex
CREATE INDEX "deposit_sources_isActive_idx" ON "deposit_sources"("isActive");

-- CreateIndex
CREATE INDEX "deposits_depositSourceId_idx" ON "deposits"("depositSourceId");

-- CreateIndex
CREATE INDEX "deposits_mammothId_idx" ON "deposits"("mammothId");

-- CreateIndex
CREATE INDEX "deposits_createdAt_idx" ON "deposits"("createdAt");

-- CreateIndex
CREATE INDEX "deposits_processed_idx" ON "deposits"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_id_depositSourceId_key" ON "deposits"("id", "depositSourceId");

-- CreateIndex
CREATE INDEX "analytics_userId_idx" ON "analytics"("userId");

-- CreateIndex
CREATE INDEX "analytics_action_idx" ON "analytics"("action");

-- CreateIndex
CREATE INDEX "analytics_createdAt_idx" ON "analytics"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_slug_idx" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_category_idx" ON "articles"("category");

-- CreateIndex
CREATE INDEX "articles_isPublished_idx" ON "articles"("isPublished");
