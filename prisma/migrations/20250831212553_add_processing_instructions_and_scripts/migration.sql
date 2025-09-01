-- CreateTable
CREATE TABLE "public"."processing_instructions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "targetRoles" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processing_scripts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "language" TEXT NOT NULL DEFAULT 'ru',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "targetRoles" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processing_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "targetRoles" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processing_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'link',
    "url" TEXT,
    "filePath" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "targetRoles" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processing_instructions_category_idx" ON "public"."processing_instructions"("category");

-- CreateIndex
CREATE INDEX "processing_instructions_priority_idx" ON "public"."processing_instructions"("priority");

-- CreateIndex
CREATE INDEX "processing_instructions_isActive_idx" ON "public"."processing_instructions"("isActive");

-- CreateIndex
CREATE INDEX "processing_instructions_isPublic_idx" ON "public"."processing_instructions"("isPublic");

-- CreateIndex
CREATE INDEX "processing_scripts_category_idx" ON "public"."processing_scripts"("category");

-- CreateIndex
CREATE INDEX "processing_scripts_language_idx" ON "public"."processing_scripts"("language");

-- CreateIndex
CREATE INDEX "processing_scripts_isActive_idx" ON "public"."processing_scripts"("isActive");

-- CreateIndex
CREATE INDEX "processing_scripts_isPublic_idx" ON "public"."processing_scripts"("isPublic");

-- CreateIndex
CREATE INDEX "processing_templates_type_idx" ON "public"."processing_templates"("type");

-- CreateIndex
CREATE INDEX "processing_templates_isActive_idx" ON "public"."processing_templates"("isActive");

-- CreateIndex
CREATE INDEX "processing_templates_isPublic_idx" ON "public"."processing_templates"("isPublic");

-- CreateIndex
CREATE INDEX "processing_resources_category_idx" ON "public"."processing_resources"("category");

-- CreateIndex
CREATE INDEX "processing_resources_type_idx" ON "public"."processing_resources"("type");

-- CreateIndex
CREATE INDEX "processing_resources_isActive_idx" ON "public"."processing_resources"("isActive");

-- CreateIndex
CREATE INDEX "processing_resources_isPublic_idx" ON "public"."processing_resources"("isPublic");
