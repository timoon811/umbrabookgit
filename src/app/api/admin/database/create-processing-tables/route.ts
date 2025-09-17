import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { requireAdminAuth } from '@/lib/api-auth';

const prisma = new PrismaClient();

const PROCESSING_TABLES_SQL = `
-- Создание таблиц системы обработки

-- Инструкции для процессинга
CREATE TABLE IF NOT EXISTS "processing_instructions" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "priority" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "targetRoles" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processing_instructions_pkey" PRIMARY KEY ("id")
);

-- Скрипты для процессинга
CREATE TABLE IF NOT EXISTS "processing_scripts" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processing_scripts_pkey" PRIMARY KEY ("id")
);

-- Шаблоны для процессинга
CREATE TABLE IF NOT EXISTS "processing_templates" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processing_templates_pkey" PRIMARY KEY ("id")
);

-- Ресурсы для процессинга
CREATE TABLE IF NOT EXISTS "processing_resources" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processing_resources_pkey" PRIMARY KEY ("id")
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS "processing_instructions_category_idx" ON "processing_instructions"("category");
CREATE INDEX IF NOT EXISTS "processing_instructions_priority_idx" ON "processing_instructions"("priority");
CREATE INDEX IF NOT EXISTS "processing_instructions_isActive_idx" ON "processing_instructions"("isActive");
CREATE INDEX IF NOT EXISTS "processing_instructions_isPublic_idx" ON "processing_instructions"("isPublic");

CREATE INDEX IF NOT EXISTS "processing_scripts_category_idx" ON "processing_scripts"("category");
CREATE INDEX IF NOT EXISTS "processing_scripts_language_idx" ON "processing_scripts"("language");
CREATE INDEX IF NOT EXISTS "processing_scripts_isActive_idx" ON "processing_scripts"("isActive");
CREATE INDEX IF NOT EXISTS "processing_scripts_isPublic_idx" ON "processing_scripts"("isPublic");

CREATE INDEX IF NOT EXISTS "processing_templates_type_idx" ON "processing_templates"("type");
CREATE INDEX IF NOT EXISTS "processing_templates_isActive_idx" ON "processing_templates"("isActive");
CREATE INDEX IF NOT EXISTS "processing_templates_isPublic_idx" ON "processing_templates"("isPublic");

CREATE INDEX IF NOT EXISTS "processing_resources_category_idx" ON "processing_resources"("category");
CREATE INDEX IF NOT EXISTS "processing_resources_type_idx" ON "processing_resources"("type");
CREATE INDEX IF NOT EXISTS "processing_resources_isActive_idx" ON "processing_resources"("isActive");
CREATE INDEX IF NOT EXISTS "processing_resources_isPublic_idx" ON "processing_resources"("isPublic");
`;

export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await requireAdmin(request);

    // Выполняем создание всех таблиц processing системы
    await prisma.$executeRawUnsafe(PROCESSING_TABLES_SQL);

    return NextResponse.json({ 
      success: true, 
      message: 'Все таблицы processing системы созданы успешно' 
    });

  } catch (error: any) {
    console.error('Error creating processing tables:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
