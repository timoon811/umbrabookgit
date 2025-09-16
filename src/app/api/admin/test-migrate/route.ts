import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Простой тест для проверки миграции без авторизации
export async function GET(request: NextRequest) {
  try {
    // Проверяем существующие колонки
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'processor_deposits' 
      AND column_name IN ('platformCommissionPercent', 'platformCommissionAmount', 'processorEarnings')
    ` as Array<{ column_name: string }>;

    const existingColumns = tableInfo.map(row => row.column_name);
    const requiredColumns = ['platformCommissionPercent', 'platformCommissionAmount', 'processorEarnings'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    return NextResponse.json({
      success: true,
      existingColumns,
      missingColumns,
      needsMigration: missingColumns.length > 0,
      status: missingColumns.length > 0 ? 'NEEDS_MIGRATION' : 'UP_TO_DATE'
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

// Применение миграции
export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    
    // Простая защита
    if (secret !== "migrate_2025") {
      return NextResponse.json(
        { error: "Неверный секретный ключ" },
        { status: 403 }
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

    return NextResponse.json({
      success: true,
      message: missingColumns.length > 0 
        ? `Добавлены колонки: ${missingColumns.join(', ')}`
        : "Все необходимые колонки уже существуют",
      addedColumns: missingColumns,
      existingColumns
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
