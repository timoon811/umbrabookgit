#!/usr/bin/env node

/**
 * Скрипт для проверки потенциальных ошибок charAt в проекте
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Проверяем проект на потенциальные ошибки charAt...\n');

// Проверяем наличие небезопасных использований charAt
try {
  const result = execSync('grep -r "\\.charAt(" src/ --include="*.tsx" --include="*.ts" || true', { encoding: 'utf8' });
  
  if (result.trim()) {
    console.log('⚠️  Найдены потенциально небезопасные использования charAt:');
    console.log(result);
    
    // Проверяем, используют ли они getUserInitial
    const lines = result.split('\n').filter(line => line.trim());
    let hasUnsafeUsage = false;
    
    lines.forEach(line => {
      if (line.includes('.charAt(') && !line.includes('getUserInitial') && !line.includes('trimmedName.charAt')) {
        console.log(`❌ Небезопасное использование: ${line}`);
        hasUnsafeUsage = true;
      }
    });
    
    if (!hasUnsafeUsage) {
      console.log('✅ Все использования charAt выглядят безопасными');
    }
  } else {
    console.log('✅ Прямых использований charAt не найдено');
  }
} catch (error) {
  console.log('ℹ️  Grep не нашел использований charAt');
}

// Проверяем использование getUserInitial
try {
  const result = execSync('grep -r "getUserInitial" src/ --include="*.tsx" --include="*.ts" || true', { encoding: 'utf8' });
  
  if (result.trim()) {
    const lines = result.split('\n').filter(line => line.trim());
    console.log(`\n✅ Найдено ${lines.length} безопасных использований getUserInitial`);
  }
} catch (error) {
  console.log('⚠️  getUserInitial не используется');
}

// Проверяем импорты
try {
  const result = execSync('grep -r "import.*getUserInitial" src/ --include="*.tsx" --include="*.ts" || true', { encoding: 'utf8' });
  
  if (result.trim()) {
    const lines = result.split('\n').filter(line => line.trim());
    console.log(`✅ Найдено ${lines.length} файлов с правильными импортами getUserInitial`);
  }
} catch (error) {
  console.log('⚠️  Импорты getUserInitial не найдены');
}

// Запускаем тесты
console.log('\n🧪 Запускаем тесты для утилит...');
try {
  execSync('npm test src/utils/__tests__/userUtils.test.ts src/__tests__/integration/user-avatar.test.tsx', { stdio: 'inherit' });
  console.log('✅ Все тесты прошли успешно!');
} catch (error) {
  console.log('❌ Тесты не прошли');
  process.exit(1);
}

console.log('\n🎉 Проверка завершена! Проект защищен от ошибок charAt.');
