import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Проверяем переменные окружения
    const databaseUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;
    const nodeEnv = process.env.NODE_ENV;
    
    // Проверяем подключение к базе данных
    let dbConnection = "Не настроено";
    let dbError = null;
    
    if (databaseUrl) {
      try {
        // Пытаемся подключиться к базе данных
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.$connect();
        dbConnection = "Успешно";
        await prisma.$disconnect();
      } catch (error: any) {
        dbConnection = "Ошибка";
        dbError = {
          code: error.code,
          message: error.message,
          name: error.name
        };
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
        url: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'Не настроено'
      },
      timestamp: new Date().toISOString(),
      message: 'Проверка подключения завершена'
    });
    
  } catch (error: any) {
    console.error('Ошибка проверки подключения:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Ошибка проверки подключения',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 });
  }
}
