#!/usr/bin/env node

/**
 * Генератор безопасных JWT секретов для UmbraPL
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function validateSecret(secret) {
  const issues = [];
  
  if (secret.length < 32) {
    issues.push('Слишком короткий (минимум 32 символа)');
  }
  
  if (secret.length < 64) {
    issues.push('Рекомендуется 64+ символов для максимальной безопасности');
  }
  
  const unsafePatterns = [
    'umbra_platform_super_secret_jwt_key_2024',
    'CHANGE_THIS_IN_PRODUCTION',
    'secret',
    'jwt_secret',
    'your-secret-key',
    'default'
  ];
  
  const foundUnsafe = unsafePatterns.find(pattern => 
    secret.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (foundUnsafe) {
    issues.push(`Содержит небезопасный паттерн: "${foundUnsafe}"`);
  }
  
  return issues;
}

function updateEnvFile(newSecret) {
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    if (envContent.includes('JWT_SECRET=')) {
      // Обновляем существующий секрет
      envContent = envContent.replace(
        /JWT_SECRET=.*/,
        `JWT_SECRET="${newSecret}"`
      );
    } else {
      // Добавляем новый секрет
      envContent += `\n# JWT Secret (auto-generated)\nJWT_SECRET="${newSecret}"\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ JWT_SECRET обновлен в ${envPath}`);
    
  } catch (error) {
    console.error(`❌ Ошибка обновления .env.local: ${error.message}`);
    console.log(`\n📋 Добавьте вручную в .env.local:\nJWT_SECRET="${newSecret}"`);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔐 Генератор безопасных JWT секретов

ИСПОЛЬЗОВАНИЕ:
  node scripts/generate-jwt-secret.js [options]

ОПЦИИ:
  --help, -h      Показать справку
  --length N      Длина секрета в байтах (по умолчанию: 64)
  --validate      Проверить текущий JWT_SECRET
  --update        Сгенерировать и обновить .env.local
  --show-only     Только показать новый секрет (не обновлять файл)

ПРИМЕРЫ:
  node scripts/generate-jwt-secret.js --show-only
  node scripts/generate-jwt-secret.js --update
  node scripts/generate-jwt-secret.js --validate
  node scripts/generate-jwt-secret.js --length 128
    `);
    return;
  }
  
  if (args.includes('--validate')) {
    console.log('🔍 Проверка текущего JWT_SECRET...\n');
    
    const currentSecret = process.env.JWT_SECRET;
    
    if (!currentSecret) {
      console.log('❌ JWT_SECRET не найден в переменных окружения');
      console.log('💡 Запустите: node scripts/generate-jwt-secret.js --update');
      return;
    }
    
    const issues = validateSecret(currentSecret);
    
    if (issues.length === 0) {
      console.log('✅ JWT_SECRET соответствует требованиям безопасности');
      console.log(`   Длина: ${currentSecret.length} символов`);
    } else {
      console.log('⚠️  Найдены проблемы с JWT_SECRET:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 Рекомендуется сгенерировать новый секрет: --update');
    }
    
    return;
  }
  
  const lengthArg = args.find(arg => arg.startsWith('--length'));
  const length = lengthArg ? parseInt(lengthArg.split('=')[1] || args[args.indexOf(lengthArg) + 1]) : 64;
  
  if (isNaN(length) || length < 16) {
    console.error('❌ Некорректная длина. Минимум: 16 байт');
    return;
  }
  
  console.log('🔐 Генерация нового JWT секрета...\n');
  
  const newSecret = generateSecureSecret(length);
  
  console.log('✅ Новый безопасный JWT секрет сгенерирован!');
  console.log(`📏 Длина: ${length} байт (${newSecret.length} символов)`);
  console.log(`🔑 Секрет: ${newSecret}\n`);
  
  // Проверяем качество сгенерированного секрета
  const issues = validateSecret(newSecret);
  if (issues.length === 0) {
    console.log('🛡️  Секрет соответствует всем требованиям безопасности');
  } else {
    console.log('⚠️  Предупреждения:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (args.includes('--update')) {
    console.log('\n📝 Обновление .env.local...');
    updateEnvFile(newSecret);
  } else if (!args.includes('--show-only')) {
    console.log('\n💡 Для обновления .env.local добавьте флаг --update');
    console.log('💡 Или скопируйте секрет вручную в ваш .env.local файл');
  }
  
  console.log('\n🔒 ВАЖНО: Сохраните этот секрет в безопасном месте!');
  console.log('🚫 Никогда не передавайте секрет через незащищенные каналы');
}

// Проверяем что мы в корне проекта
if (!fs.existsSync('package.json')) {
  console.error('❌ Скрипт должен запускаться из корня проекта');
  process.exit(1);
}

main();
