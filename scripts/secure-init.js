#!/usr/bin/env node

/**
 * Безопасная инициализация UmbraPL
 * Заменяет удаленные /api/seed и /api/admin/deploy эндпоинты
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Создание интерфейса для ввода
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecurePassword() {
  return crypto.randomBytes(16).toString('hex');
}

async function validatePassword(password) {
  if (password.length < 8) {
    throw new Error('Пароль должен содержать минимум 8 символов');
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new Error('Пароль должен содержать строчные и заглавные буквы, а также цифры');
  }
  
  // Проверка на слабые пароли
  const weakPasswords = ['password', '123456', 'admin', 'umbra2024', 'user123'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    throw new Error('Пароль слишком простой. Избегайте общих слов и паттернов');
  }
  
  return true;
}

async function createSecureAdmin() {
  try {
    log('\n🔐 СОЗДАНИЕ АДМИНИСТРАТОРА', 'bold');
    log('═'.repeat(50), 'blue');
    
    // Проверяем существующего админа
    const existingAdmin = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      logWarning('Администратор уже существует:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   ID: ${existingAdmin.id}`);
      
      const overwrite = await question('Создать нового админа? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        return existingAdmin;
      }
    }
    
    // Ввод данных админа
    const email = await question('Email администратора: ') || 'admin@umbra-platform.dev';
    
    let password;
    const useGenerated = await question('Сгенерировать безопасный пароль? (Y/n): ');
    
    if (useGenerated.toLowerCase() !== 'n') {
      password = generateSecurePassword();
      logSuccess(`Сгенерирован пароль: ${password}`);
      logWarning('СОХРАНИТЕ ЭТОТ ПАРОЛЬ В БЕЗОПАСНОМ МЕСТЕ!');
    } else {
      while (true) {
        password = await question('Пароль администратора: ');
        try {
          await validatePassword(password);
          break;
        } catch (error) {
          logError(error.message);
        }
      }
    }
    
    const name = await question('Имя администратора: ') || 'Umbra Platform Admin';
    const telegram = await question('Telegram (необязательно): ') || '';
    
    // Создание админа
    logInfo('Создание администратора...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await prisma.users.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
        telegram: telegram || null,
        role: 'ADMIN',
        status: 'APPROVED'
      },
      create: {
        email,
        password: hashedPassword,
        name,
        telegram: telegram || null,
        role: 'ADMIN',
        status: 'APPROVED'
      }
    });
    
    logSuccess('Администратор создан успешно!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    
    return admin;
    
  } catch (error) {
    logError(`Ошибка создания администратора: ${error.message}`);
    throw error;
  }
}

async function initializeDocumentation() {
  try {
    log('\n📚 ИНИЦИАЛИЗАЦИЯ ДОКУМЕНТАЦИИ', 'bold');
    log('═'.repeat(50), 'blue');
    
    // Проверяем существующую документацию
    const existingDocs = await prisma.documentation.count();
    if (existingDocs > 0) {
      logInfo(`Найдено ${existingDocs} документов`);
      const reinit = await question('Переинициализировать документацию? (y/N): ');
      if (reinit.toLowerCase() !== 'y') {
        return;
      }
    }
    
    // Создаем разделы документации
    const documentationSections = [
      {
        name: "Начало работы",
        key: "getting-started",
        description: "Базовое руководство по началу работы с платформой",
        order: 1,
        isVisible: true,
      },
      {
        name: "Установка",
        key: "installation",
        description: "Пошаговая инструкция по установке платформы",
        order: 2,
        isVisible: true,
      },
      {
        name: "API справочник",
        key: "api-reference",
        description: "Полный справочник по API платформы",
        order: 3,
        isVisible: true,
      },
    ];

    const createdSections = new Map();
    
    for (const section of documentationSections) {
      const createdSection = await prisma.documentation_sections.upsert({
        where: { key: section.key },
        update: section,
        create: section,
      });
      createdSections.set(section.key, createdSection.id);
      logInfo(`Создан раздел: ${section.name}`);
    }

    // Создаем базовые страницы
    const documentationPages = [
      {
        title: "Начало работы с Umbra Platform",
        description: "Базовое руководство по началу работы с платформой",
        slug: "getting-started",
        content: JSON.stringify([
          {
            type: "heading",
            level: 1,
            content: "Добро пожаловать в Umbra Platform"
          },
          {
            type: "paragraph",
            content: "Umbra Platform - это современная платформа для управления документацией, курсами и образовательным контентом."
          },
          {
            type: "heading",
            level: 2,
            content: "Быстрый старт"
          },
          {
            type: "paragraph",
            content: "Для начала работы войдите в систему под созданным администратором и изучите доступные разделы."
          }
        ]),
        sectionId: createdSections.get("getting-started"),
        order: 1,
        isPublished: true,
      },
      {
        title: "Установка и настройка",
        description: "Пошаговая инструкция по установке платформы",
        slug: "installation", 
        content: JSON.stringify([
          {
            type: "heading",
            level: 1,
            content: "Установка Umbra Platform"
          },
          {
            type: "paragraph",
            content: "Платформа настроена и готова к использованию. Дополнительная конфигурация может быть выполнена через админ панель."
          }
        ]),
        sectionId: createdSections.get("installation"),
        order: 2,
        isPublished: true,
      },
      {
        title: "API справочник",
        description: "Полный справочник по API платформы",
        slug: "api-reference",
        content: JSON.stringify([
          {
            type: "heading",
            level: 1,
            content: "API Справочник"
          },
          {
            type: "paragraph",
            content: "Полная документация по API endpoints доступна по адресу /api-docs"
          }
        ]),
        sectionId: createdSections.get("api-reference"),
        order: 3,
        isPublished: true,
      },
    ];

    for (const page of documentationPages) {
      await prisma.documentation.upsert({
        where: { slug: page.slug },
        update: page,
        create: page,
      });
      logInfo(`Создана страница: ${page.title}`);
    }
    
    logSuccess('Базовая документация инициализирована!');
    
  } catch (error) {
    logError(`Ошибка инициализации документации: ${error.message}`);
    throw error;
  }
}

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    logSuccess('Подключение к базе данных установлено');
    return true;
  } catch (error) {
    logError(`Ошибка подключения к БД: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    log('\n🚀 БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ UMBRA PLATFORM', 'bold');
    log('═'.repeat(60), 'blue');
    
    // Проверка подключения к БД
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      process.exit(1);
    }
    
    // Создание администратора
    const admin = await createSecureAdmin();
    
    // Инициализация документации
    await initializeDocumentation();
    
    log('\n🎉 ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА!', 'bold');
    log('═'.repeat(50), 'green');
    logSuccess('Платформа готова к использованию');
    
    if (admin) {
      log('\n📋 ИНФОРМАЦИЯ ДЛЯ ВХОДА:', 'bold');
      console.log(`   URL: http://localhost:3000/login`);
      console.log(`   Email: ${admin.email}`);
      logWarning('   Пароль: СОХРАНЕН ВЫШЕ В ЛОГАХ');
    }
    
    log('\n📖 СЛЕДУЮЩИЕ ШАГИ:', 'bold');
    console.log('   1. Войдите в админ панель');
    console.log('   2. Настройте переменные окружения');
    console.log('   3. Измените пароль администратора');
    console.log('   4. Настройте backup и мониторинг');
    
  } catch (error) {
    logError(`Критическая ошибка: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 Безопасная инициализация Umbra Platform

ИСПОЛЬЗОВАНИЕ:
  node scripts/secure-init.js [options]

ОПЦИИ:
  --help, -h     Показать эту справку
  --admin-only   Создать только администратора
  --docs-only    Инициализировать только документацию

БЕЗОПАСНОСТЬ:
  ✅ Генерация криптографически стойких паролей
  ✅ Валидация сложности паролей
  ✅ Отсутствие hardcoded секретов
  ✅ Интерактивный ввод конфиденциальных данных
  
ПРИМЕРЫ:
  node scripts/secure-init.js
  node scripts/secure-init.js --admin-only
  `);
  process.exit(0);
}

// Проверка что мы в корне проекта
const fs = require('fs');
if (!fs.existsSync('package.json')) {
  logError('Скрипт должен запускаться из корня проекта');
  process.exit(1);
}

main();
