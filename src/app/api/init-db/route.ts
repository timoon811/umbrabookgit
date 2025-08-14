import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Начинаем инициализацию базы данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к БД установлено');
    
    // Проверяем, есть ли пользователи
    const userCount = await prisma.user.count();
    console.log(`📊 Количество пользователей: ${userCount}`);
    
    if (userCount === 0) {
      console.log('🌱 База данных пуста, создаем начальные данные...');
      
      // Создаем администратора
      const adminPassword = await bcrypt.hash('umbra2024', 10);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@umbra-platform.dev',
          name: 'Umbra Platform Admin',
          password: adminPassword,
          role: 'ADMIN',
          status: 'APPROVED',
          apiKey: 'umbra_admin_key_' + Math.random().toString(36).substring(2, 15),
        },
      });
      
      console.log('✅ Администратор создан:', admin.email);
      
      // Создаем тестового пользователя
      const userPassword = await bcrypt.hash('user123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'user@umbra-platform.dev',
          name: 'Regular User',
          password: userPassword,
          role: 'USER',
          status: 'APPROVED',
          apiKey: 'umbra_user_key_' + Math.random().toString(36).substring(2, 15),
        },
      });
      
      console.log('✅ Тестовый пользователь создан:', user.email);
      
      // Создаем базовые категории
      const categories = [
        {
          key: 'getting-started',
          name: 'НАЧАЛО РАБОТЫ',
          description: 'Основы работы с платформой',
          order: 1,
        },
        {
          key: 'api',
          name: 'API REFERENCE V2',
          description: 'Документация по API',
          order: 2,
        },
      ];
      
      for (const categoryData of categories) {
        await prisma.category.upsert({
          where: { key: categoryData.key },
          update: categoryData,
          create: categoryData,
        });
      }
      
      console.log('✅ Базовые категории созданы');
      
      return NextResponse.json({
        status: 'success',
        message: 'База данных инициализирована',
        admin: {
          email: admin.email,
          role: admin.role,
          status: admin.status,
        },
        user: {
          email: user.email,
          role: user.role,
          status: user.status,
        },
        categories: categories.length,
      });
      
    } else {
      console.log('📋 База данных уже содержит данные');
      
      // Проверяем администратора
      const admin = await prisma.user.findFirst({
        where: { 
          email: 'admin@umbra-platform.dev',
          role: 'ADMIN'
        }
      });
      
      if (admin) {
        console.log('✅ Администратор найден:', admin.email);
        return NextResponse.json({
          status: 'success',
          message: 'База данных уже инициализирована',
          admin: {
            email: admin.email,
            role: admin.role,
            status: admin.status,
          },
          userCount,
        });
      } else {
        console.log('❌ Администратор не найден, создаем...');
        
        // Создаем администратора
        const adminPassword = await bcrypt.hash('umbra2024', 10);
        const newAdmin = await prisma.user.create({
          data: {
            email: 'admin@umbra-platform.dev',
            name: 'Umbra Platform Admin',
            password: adminPassword,
            role: 'ADMIN',
            status: 'APPROVED',
            apiKey: 'umbra_admin_key_' + Math.random().toString(36).substring(2, 15),
          },
        });
        
        console.log('✅ Администратор создан:', newAdmin.email);
        
        return NextResponse.json({
          status: 'success',
          message: 'Администратор создан',
          admin: {
            email: newAdmin.email,
            role: newAdmin.role,
            status: newAdmin.status,
          },
          userCount: userCount + 1,
        });
      }
    }
    
  } catch (error: any) {
    console.error('❌ Ошибка инициализации:', error);
    
    let errorMessage = 'Внутренняя ошибка сервера';
    let statusCode = 500;
    
    if (error.code === 'P1001') {
      errorMessage = 'Ошибка подключения к базе данных';
      statusCode = 503;
    } else if (error.code === 'P2002') {
      errorMessage = 'Пользователь уже существует';
      statusCode = 409;
    } else if (error.code === 'P1017') {
      errorMessage = 'Сервер базы данных отклонил подключение';
      statusCode = 503;
    }
    
    return NextResponse.json({
      status: 'error',
      message: errorMessage,
      error: error.message,
    }, { status: statusCode });
    
  } finally {
    await prisma.$disconnect();
  }
}
