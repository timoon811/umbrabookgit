#!/usr/bin/env node

/**
 * Преддеплойный чек-лист для Umbra Platform
 * Запускает: node scripts/predeploy-check.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ПРЕДДЕПЛОЙНАЯ ПРОВЕРКА UMBRA PLATFORM\n');

// Проверки
const checks = {
  '📁 Структура файлов': () => {
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tailwind.config.js',
      'tsconfig.json',
      'prisma/schema.prisma',
      '.env.example',
      'README_DEPLOY.md'
    ];

    let allExist = true;
    requiredFiles.forEach(file => {
      if (!fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`❌ Отсутствует: ${file}`);
        allExist = false;
      }
    });

    if (allExist) {
      console.log('✅ Все необходимые файлы присутствуют');
    }
    return allExist;
  },

  '📦 Зависимости': () => {
    const packageJson = require('../package.json');

    // Проверяем отсутствие конфликтующих зависимостей
    const conflicts = [];
    if (packageJson.dependencies.bcrypt && packageJson.dependencies.bcryptjs) {
      conflicts.push('bcrypt и bcryptjs одновременно');
    }

    if (conflicts.length > 0) {
      console.log(`❌ Конфликты зависимостей: ${conflicts.join(', ')}`);
      return false;
    }

    console.log('✅ Зависимости корректны');
    return true;
  },

  '🔧 Конфигурация': () => {
    const nextConfig = require('../next.config.js');

    // Проверяем наличие production настроек
    const hasCompiler = nextConfig.compiler?.removeConsole !== undefined;
    const hasImagesConfig = nextConfig.images?.remotePatterns !== undefined;

    if (!hasCompiler) {
      console.log('⚠️  Предупреждение: отсутствует оптимизация компилятора');
    }

    if (!hasImagesConfig) {
      console.log('⚠️  Предупреждение: отсутствует конфигурация изображений');
    }

    console.log('✅ Конфигурация проверена');
    return true;
  },

  '🗄️  База данных': () => {
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
      console.log('❌ Отсутствует схема базы данных');
      return false;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Проверяем наличие enum TransactionType
    if (!schema.includes('enum TransactionType')) {
      console.log('❌ Отсутствует enum TransactionType');
      return false;
    }

    // Проверяем наличие индексов
    const hasIndexes = schema.includes('@@index');
    if (!hasIndexes) {
      console.log('⚠️  Предупреждение: отсутствуют индексы базы данных');
    }

    console.log('✅ Схема базы данных корректна');
    return true;
  },

  '🔐 Безопасность': () => {
    const authLib = path.join(__dirname, '..', 'src', 'lib', 'auth.ts');

    if (!fs.existsSync(authLib)) {
      console.log('❌ Отсутствует файл аутентификации');
      return false;
    }

    const authCode = fs.readFileSync(authLib, 'utf8');

    // Проверяем наличие экспорта JWT_SECRET
    if (!authCode.includes('export const JWT_SECRET')) {
      console.log('❌ JWT_SECRET не экспортируется');
      return false;
    }

    console.log('✅ Настройки безопасности корректны');
    return true;
  },

  '🎨 Темы и стили': () => {
    const components = [
      'AdminHeader.tsx',
      'AdminSidebar.tsx',
      'AuthenticatedHome.tsx',
      'ThemeToggle.tsx'
    ];

    let allHaveThemes = true;
    components.forEach(component => {
      const componentPath = path.join(__dirname, '..', 'src', 'components', component);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        if (!content.includes('dark:')) {
          console.log(`⚠️  Компонент ${component} может не поддерживать темную тему`);
        }
      }
    });

    console.log('✅ Стили и темы проверены');
    return true;
  }
};

// Запуск проверок
let allPassed = true;

Object.entries(checks).forEach(([name, check]) => {
  console.log(`\n🔍 ${name}:`);
  const passed = check();
  if (!passed) {
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 ВСЕ ПРОВЕРКИ ПРОШЛИ УСПЕШНО!');
  console.log('🚀 Проект готов к развертыванию');
  process.exit(0);
} else {
  console.log('❌ НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОШЛИ');
  console.log('🔧 Исправьте найденные проблемы перед развертыванием');
  process.exit(1);
}
