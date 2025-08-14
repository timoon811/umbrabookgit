import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Начинаем применение миграций...');
    
    // Применяем миграции
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'pipe',
        env: process.env,
        cwd: process.cwd()
      });
      console.log('✅ Миграции применены');
    } catch (error: unknown) {
      console.error('❌ Ошибка применения миграций:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Ошибка применения миграций',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Генерируем Prisma Client
    try {
      execSync('npx prisma generate', { 
        stdio: 'pipe',
        env: process.env,
        cwd: process.cwd()
      });
      console.log('✅ Prisma Client сгенерирован');
    } catch (error: unknown) {
      console.error('❌ Ошибка генерации Prisma Client:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Ошибка генерации Prisma Client',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Миграции применены успешно',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    console.error('❌ Ошибка применения миграций:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Внутренняя ошибка сервера',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
