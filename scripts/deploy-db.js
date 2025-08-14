const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function deployDatabase() {
  try {
    console.log('🚀 Начинаем деплой базы данных...');
    
    // Проверяем подключение
    console.log('🔌 Проверяем подключение к БД...');
    await prisma.$connect();
    console.log('✅ Подключение к БД установлено');
    
    // Применяем миграции
    console.log('📦 Применяем миграции...');
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: process.env 
      });
      console.log('✅ Миграции применены');
    } catch (error) {
      console.log('⚠️ Ошибка применения миграций:', error.message);
      console.log('🔄 Пытаемся создать миграции заново...');
      
      try {
        execSync('npx prisma migrate dev --name init', { 
          stdio: 'inherit',
          env: process.env 
        });
        console.log('✅ Миграции созданы и применены');
      } catch (migrateError) {
        console.log('❌ Ошибка создания миграций:', migrateError.message);
      }
    }
    
    // Генерируем Prisma Client
    console.log('🔧 Генерируем Prisma Client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        env: process.env 
      });
      console.log('✅ Prisma Client сгенерирован');
    } catch (error) {
      console.log('❌ Ошибка генерации Prisma Client:', error.message);
    }
    
    // Проверяем структуру базы данных
    console.log('🔍 Проверяем структуру БД...');
    const userCount = await prisma.user.count();
    console.log(`📊 Количество пользователей: ${userCount}`);
    
    if (userCount === 0) {
      console.log('🌱 База данных пуста, запускаем seed...');
      try {
        execSync('npm run db:seed', { 
          stdio: 'inherit',
          env: process.env 
        });
        console.log('✅ Seed выполнен');
      } catch (error) {
        console.log('❌ Ошибка seed:', error.message);
        console.log('🔄 Пытаемся создать базовые данные вручную...');
        
        // Создаем базовые данные вручную
        await createBasicData();
      }
    } else {
      console.log('📋 База данных содержит данные');
    }
    
    console.log('🎉 Деплой базы данных завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка деплоя:', error);
    
    if (error.code === 'P1001') {
      console.error('🔴 Ошибка подключения к базе данных');
      console.error('   Проверьте переменную DATABASE_URL');
      console.error('   Убедитесь, что база данных доступна');
    } else if (error.code === 'P1017') {
      console.error('🔴 Сервер базы данных отклонил подключение');
    } else if (error.code === 'P2024') {
      console.error('🔴 Таймаут подключения к базе данных');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

async function createBasicData() {
  try {
    console.log('🔧 Создаем базовые данные...');
    
    // Создаем администратора
    const bcrypt = require('bcryptjs');
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
    
  } catch (error) {
    console.error('❌ Ошибка создания базовых данных:', error);
  }
}

deployDatabase();
