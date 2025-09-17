#!/usr/bin/env node

/**
 * Точечное исправление критических синтаксических ошибок
 */

const fs = require('fs');

const problemFiles = [
  'src/app/api/admin/goals/[id]/route.ts',
  'src/app/api/admin/goals/route.ts', 
  'src/app/api/admin/shift-logs/route.ts',
  'src/app/api/admin/shifts/auto-end-check/route.ts',
  'src/app/api/admin/upload/route.ts'
];

function fixCriticalFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 1. Исправляем проблему с return в catch блоках
    content = content.replace(
      /(\s+}\s*catch\s*\(\s*error[^{]*\{[^}]*)(,)\s*->\s*return/g,
      '$1\n    return'
    );
    
    // 2. Исправляем неправильно структурированные catch блоки
    content = content.replace(
      /(\s+)\} catch \(error\) \{\s*console\.error\([^)]+\);\s*,\s*->\s*return NextResponse\.json\(/g,
      '$1} catch (error: any) {\n$1  console.error(\'API Error:\', error);\n$1  return NextResponse.json('
    );
    
    // 3. Исправляем неправильные символы в catch блоках
    content = content.replace(
      /console\.error\([^)]+\);\s*,\s*->\s*return/g,
      'console.error(\'API Error:\', error);\n    return'
    );
    
    // 4. Исправляем неправильную структуру return в error handlers
    content = content.replace(
      /(\s+return NextResponse\.json\(\s*\{ error: [^}]+\},\s*\{ status: \d+ \}\s*)\`->\s*\);/g,
      '$1);'
    );
    
    // 5. Исправляем Expression expected ошибки
    content = content.replace(
      /(\s+\{ status: \d+ \}\s*)\`->\s*\);(\s+\}\s*\}\s*\^)/g,
      '$1);$2'
    );
    
    // 6. Убираем лишние символы и исправляем EOF проблемы
    content = content.replace(/\`->/g, '');
    content = content.replace(/\|\s*$/gm, '');
    content = content.replace(/\^$/gm, '');
    
    // 7. Исправляем неправильные закрывающие скобки
    content = content.replace(
      /(\s+)\}\s*\}\s*\^?$/,
      '$1}\n}'
    );
    
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

console.log('🔧 Точечное исправление критических ошибок...');

let fixedCount = 0;

for (const file of problemFiles) {
  if (fs.existsSync(file)) {
    if (fixCriticalFile(file)) {
      console.log(`✅ Исправлен: ${file}`);
      fixedCount++;
    } else {
      console.log(`⚪ Без изменений: ${file}`);
    }
  } else {
    console.log(`⚠️ Файл не найден: ${file}`);
  }
}

console.log(`\n📊 Результат: исправлено ${fixedCount} файлов`);

// Проверяем сборку
console.log('\n🏗️ Проверка сборки...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
  console.log('✅ Сборка успешна!');
  process.exit(0);
} catch (error) {
  console.log('❌ Ошибки все еще есть, требуется ручное исправление последних файлов');
  const output = error.stdout?.toString() || error.stderr?.toString() || '';
  console.log('\nПоследние ошибки:');
  console.log(output.split('\n').slice(-10).join('\n'));
  process.exit(1);
}
