import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { requireAdminAuth } from '@/lib/api-auth';

// POST /api/admin/migrate - Применение отсутствующих миграций (только для админов)
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    
    const { action } = await request.json();
    
    if (action !== "apply_platform_commission_columns") {
      return NextResponse.json(
        { error: "Неизвестное действие" },
        { status: 400 }
      );
    }

    // Проверяем существующие колонки
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'processor_deposits' 
      AND column_name IN ('platformCommissionPercent', 'platformCommissionAmount', 'processorEarnings')
    ` as Array<{ column_name: string }>;

    const existingColumns = tableInfo.map(row => row.column_name);
    const missingColumns = [];

    // Применяем отсутствующие колонки
    if (!existingColumns.includes('platformCommissionPercent')) {
      await prisma.$executeRaw`
        ALTER TABLE "processor_deposits" 
        ADD COLUMN "platformCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0
      `;
      missingColumns.push('platformCommissionPercent');
    }

    if (!existingColumns.includes('platformCommissionAmount')) {
      await prisma.$executeRaw`
        ALTER TABLE "processor_deposits" 
        ADD COLUMN "platformCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
      `;
      missingColumns.push('platformCommissionAmount');
    }

    if (!existingColumns.includes('processorEarnings')) {
      await prisma.$executeRaw`
        ALTER TABLE "processor_deposits" 
        ADD COLUMN "processorEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0
      `;
      missingColumns.push('processorEarnings');
    }

    // Проверяем результат
    const finalTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'processor_deposits' 
      AND column_name IN ('platformCommissionPercent', 'platformCommissionAmount', 'processorEarnings')
      ORDER BY column_name
    ` as Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string;
    }>;

    return NextResponse.json({
      success: true,
      message: missingColumns.length > 0 
        ? `Добавлены колонки: ${missingColumns.join(', ')}`
        : "Все необходимые колонки уже существуют",
      addedColumns: missingColumns,
      existingColumns,
      finalColumns: finalTableInfo
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка применения миграции:", error);
    return NextResponse.json(
      { 
        error: "Ошибка применения миграции", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/migrate - Проверка состояния миграций
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    // Проверяем существующие колонки
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'processor_deposits' 
      ORDER BY ordinal_position
    ` as Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string;
    }>;

    const requiredColumns = ['platformCommissionPercent', 'platformCommissionAmount', 'processorEarnings'];
    const existingColumns = tableInfo.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    return NextResponse.json({
      success: true,
      allColumns: tableInfo,
      requiredColumns,
      existingColumns,
      missingColumns,
      needsMigration: missingColumns.length > 0
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка проверки миграций:", error);
    return NextResponse.json(
      { 
        error: "Ошибка проверки миграций", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
