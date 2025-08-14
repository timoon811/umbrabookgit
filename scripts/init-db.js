const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🔌 Подключение к базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к БД установлено');
    
    // Проверяем, есть ли таблицы
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
        console.log('   Статус:', admin.status);
        console.log('   Роль:', admin.role);
      } else {
        console.log('❌ Администратор не найден');
      }
    }
    
    console.log('🎉 Инициализация завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
    
    if (error.code === 'P1001') {
      console.error('🔴 Ошибка подключения к базе данных');
      console.error('   Проверьте переменную DATABASE_URL');
    } else if (error.code === 'P2002') {
      console.error('🔴 Ошибка дублирования уникального поля');
    } else if (error.code === 'P2025') {
      console.error('🔴 Запись не найдена');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
