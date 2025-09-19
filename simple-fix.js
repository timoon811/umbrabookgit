#!/usr/bin/env node

/**
 * Простое и эффективное исправление проблемных файлов
 */

const fs = require('fs');

// Конкретные проблемные файлы
const problemFiles = [
  'src/app/api/admin/users/[id]/shifts/route.ts',
  'src/app/api/manager/goals/route.ts',
  'src/app/api/manager/stats-detailed/route.ts'
];

function fixSpecificFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 1. Исправляем дублированные переменные user
    if (filePath.includes('users/[id]/shifts')) {
      content = content.replace(
        /const user = await prisma\.users\.findUnique\(\{[^}]+\}\);(\s*)const user = await/g,
        'const user = await prisma.users.findUnique({\n      where: {\n        id: userId\n      }\n    });$1const targetUser = await'
      );
    }
    
    // 2. Исправляем дублированные authResult
    content = content.replace(
      /(const authResult = await \w+Auth\([^)]*\);[^}]*const \{ user \} = authResult;)\s*(const authResult = await)/g,
      '$1\n    const authResult2 = await'
    );
    
    // 3. Исправляем все использования второй переменной user на targetUser
    if (content.includes('const targetUser = await')) {
      // Заменяем использования второй переменной user
      const lines = content.split('\n');
      let afterTargetUser = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const targetUser = await')) {
          afterTargetUser = true;
          continue;
        }
        
        if (afterTargetUser && lines[i].includes('user.') && !lines[i].includes('targetUser')) {
          lines[i] = lines[i].replace(/\buser\./g, 'targetUser.');
        }
      }
      
      content = lines.join('\n');
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Ошибка в ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('🔧 Исправление конкретных проблемных файлов...\n');

let fixedCount = 0;

for (const file of problemFiles) {
  if (fixSpecificFile(file)) {
    console.log(`✅ Исправлен: ${file}`);
    fixedCount++;
  } else {
    console.log(`⚪ Без изменений: ${file}`);
  }
}

console.log(`\n📊 Исправлено файлов: ${fixedCount}`);

console.log('\n🏗️ Проверка сборки...');
const { execSync } = require('child_process');

try {
  const result = execSync('npm run build', { 
    stdio: 'pipe', 
    timeout: 60000,
    encoding: 'utf8'
  });
  
  if (result.includes('✓ Compiled successfully')) {
    console.log('🎉 СБОРКА УСПЕШНА!');
  } else {
    console.log('✅ Сборка завершена');
  }
  
} catch (error) {
  const errorOutput = error.stdout || error.stderr || '';
  
  if (errorOutput.includes('✓ Compiled successfully')) {
    console.log('🎉 СБОРКА УСПЕШНА!');
  } else {
    console.log('⚠️ Остались ошибки:');
    
    // Показываем первые 15 строк ошибки
    const lines = errorOutput.split('\n');
    const importantLines = lines.slice(0, 15);
    console.log(importantLines.join('\n'));
  }
}

console.log('\n🎯 Исправление завершено!');

// Самоудаление
setTimeout(() => {
  try {
    fs.unlinkSync(__filename);
  } catch (e) {}
}, 1000);


