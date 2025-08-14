import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Проверяем переменные окружения
    const databaseUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;
    const nodeEnv = process.env.NODE_ENV;
    
    // Проверяем подключение к базе данных
    let dbConnection = "Не настроено";
    let dbError = null;
    let dbDetails = null;
    
    if (databaseUrl) {
      try {
        // Пытаемся подключиться к базе данных
        const prisma = new PrismaClient();
        
        await prisma.$connect();
        dbConnection = "Успешно";
        
        // Проверяем структуру БД
        try {
          const userCount = await prisma.user.count();
          const categoryCount = await prisma.category.count();
          dbDetails = {
            userCount,
            categoryCount,
            tables: ['user', 'category']
          };
        } catch (queryError: unknown) {
          if (queryError && typeof queryError === 'object' && 'message' in queryError) {
            dbDetails = {
              error: String(queryError.message),
              code: 'code' in queryError ? String(queryError.code) : undefined
            };
          }
        }
        
        await prisma.$disconnect();
      } catch (error: unknown) {
        dbConnection = "Ошибка";
        if (error && typeof error === 'object') {
          dbError = {
            code: 'code' in error ? String(error.code) : undefined,
            message: 'message' in error ? String(error.message) : undefined,
            name: 'name' in error ? String(error.name) : undefined
          };
        }
      }
    }
    
    return NextResponse.json({
      status: 'success',
      environment: {
        NODE_ENV: nodeEnv || 'Не настроено',
        DATABASE_URL: databaseUrl ? 'Настроено' : 'Не настроено',
        JWT_SECRET: jwtSecret ? 'Настроено' : 'Не настроено',
      },
      database: {
        connection: dbConnection,
        error: dbError,
        details: dbDetails,
        url: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'Не настроено'
      },
      timestamp: new Date().toISOString(),
      message: 'Проверка подключения завершена'
    });
    
  } catch (error: unknown) {
    console.error('Ошибка проверки подключения:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Ошибка проверки подключения',
      error: {
        name: error && typeof error === 'object' && 'name' in error ? String(error.name) : 'Unknown',
        message: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error',
        stack: error && typeof error === 'object' && 'stack' in error ? String(error.stack) : undefined
      }
    }, { status: 500 });
  }
}
