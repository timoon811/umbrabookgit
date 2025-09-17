import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdminAuth } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;



    // Сначала очистим все таблицы
    await prisma.$executeRaw`TRUNCATE TABLE analytics RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE course_pages RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE course_sections RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE courses RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE deposits RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE deposit_sources RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE documentation RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE documentation_sections RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE finance_transactions RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE finance_projects RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE finance_counterparties RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE finance_categories RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE finance_accounts RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE content_projects RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE articles RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;


    return NextResponse.json({ 
      success: true, 
      message: "База данных готова к импорту. Теперь нужно выполнить SQL дамп через SSH." 
    });

  } catch (error: any) {
    console.error("❌ Ошибка при подготовке базы данных:", error);
    return NextResponse.json({ 
      error: 'Database preparation failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
