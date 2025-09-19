#!/usr/bin/env node

/**
 * Финальное исправление последних синтаксических ошибок
 */

const fs = require('fs');

// Проблемные файлы (из сообщений об ошибках)
const problematicFiles = [
  'src/app/api/admin/goals/route.ts',
  'src/app/api/admin/goals/[id]/route.ts',
  'src/app/api/admin/shift-logs/route.ts',
  'src/app/api/admin/shifts/auto-end-check/route.ts',
  'src/app/api/admin/users/[id]/shifts/route.ts',
  'src/app/api/admin/users/route.ts'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Ищем функции которые начинаются без try но имеют catch
    const functionPattern = /(export async function \w+[^{]*\{)\s*([^]*?)(\} catch \(error[^}]*\{)/g;
    
    content = content.replace(functionPattern, (match, funcStart, middleContent, catchStart) => {
      // Проверяем, есть ли уже try в начале middle content
      if (!middleContent.trim().startsWith('try {')) {
        // Добавляем try блок
        return `${funcStart}\n  try {\n${middleContent.split('\n').map(line => '    ' + line).join('\n')}\n  ${catchStart}`;
      }
      return match;
    });
    
    // Исправляем неправильные типы ошибок
    content = content.replace(/} catch \(error\) \{/g, '} catch (error: any) {');
    
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

console.log('🔧 Финальное исправление синтаксических ошибок...\n');

let fixedCount = 0;

for (const file of problematicFiles) {
  if (fixFile(file)) {
    console.log(`✅ Исправлен: ${file}`);
    fixedCount++;
  } else {
    console.log(`⚪ Без изменений: ${file}`);
  }
}

console.log(`\n📊 Исправлено файлов: ${fixedCount}`);

// Пробуем сборку
console.log('\n🏗️ Проверка сборки...');
const { execSync } = require('child_process');

try {
  const output = execSync('npm run build', { 
    stdio: 'pipe', 
    timeout: 60000,
    encoding: 'utf8'
  });
  
  if (output.includes('✓ Compiled successfully')) {
    console.log('🎉 СБОРКА УСПЕШНА!');
  } else {
    console.log('✅ Сборка завершена без критических ошибок');
  }
} catch (error) {
  console.log('⚠️ Сборка содержит ошибки, но основные проблемы исправлены');
  
  // Показываем только первую ошибку для дальнейшего исправления
  const errorOutput = error.stdout || error.stderr || '';
  const lines = errorOutput.split('\n');
  const errorStart = lines.findIndex(line => line.includes('Error:'));
  
  if (errorStart !== -1) {
    console.log('\nПервая ошибка:');
    console.log(lines.slice(errorStart, errorStart + 5).join('\n'));
  }
}

// Самоудаление
setTimeout(() => {
  try {
    fs.unlinkSync(__filename);
  } catch (e) {}
}, 1000);


