const fs = require('fs');

// Читаем CSV файл
const csvData = fs.readFileSync('all_users.csv', 'utf8');
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

// Пропускаем заголовок
const userLines = lines.slice(1);

console.log(`Обрабатываем ${userLines.length} пользователей...`);

// Конвертируем CSV в массив объектов TypeScript
const users = userLines.map(line => {
  // Разбираем CSV строку с учетом запятых в кавычках
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue); // последнее значение
  
  // Проверяем что у нас правильное количество полей
  if (values.length !== headers.length) {
    console.warn(`Строка имеет ${values.length} полей вместо ${headers.length}:`, line.substring(0, 100));
    return null;
  }
  
  const [id, email, name, password, telegram, role, status, isBlocked, createdAt, updatedAt] = values;
  
  return {
    id: id.trim(),
    email: email.trim(),
    name: name.trim(),
    password: password.trim(),
    telegram: telegram.trim() || null,
    role: role.trim(),
    status: status.trim(),
    isBlocked: isBlocked.trim() === 't',
    createdAt: createdAt.trim(),
    updatedAt: updatedAt.trim()
  };
}).filter(user => user !== null);

console.log(`Успешно обработано ${users.length} пользователей`);

// Генерируем TypeScript код для API endpoint
const tsCode = `import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log("🔄 Начинаем полную миграцию всех ${users.length} пользователей...");

    // Очищаем существующих пользователей
    await prisma.users.deleteMany({});
    console.log("✅ Очистили таблицу пользователей");
    
    const allUsers = ${JSON.stringify(users, null, 6)};

    console.log(\`Создаем \${allUsers.length} пользователей...\`);

    // Создаем пользователей батчами по 10
    const batchSize = 10;
    let created = 0;
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      
      for (const user of batch) {
        try {
          await prisma.users.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              password: user.password,
              telegram: user.telegram,
              role: user.role as any,
              status: user.status as any,
              isBlocked: user.isBlocked,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            }
          });
          created++;
          
          if (created % 20 === 0) {
            console.log(\`✅ Создано \${created} пользователей...\`);
          }
        } catch (error: any) {
          console.warn(\`⚠️ Ошибка при создании пользователя \${user.email}:\`, error.message);
        }
      }
    }

    console.log(\`🎉 Миграция завершена! Создано \${created} из \${allUsers.length} пользователей\`);

    return NextResponse.json({ 
      success: true, 
      message: \`Успешно мигрировано \${created} из \${allUsers.length} пользователей\`,
      created_count: created,
      total_count: allUsers.length
    });

  } catch (error: any) {
    console.error("❌ Ошибка при миграции пользователей:", error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;

// Сохраняем в файл
fs.writeFileSync('src/app/api/migrate-all-users/route.ts', tsCode);
console.log('✅ Создан файл src/app/api/migrate-all-users/route.ts');

// Выводим некоторую статистику
const roleStats = {};
const statusStats = {};

users.forEach(user => {
  roleStats[user.role] = (roleStats[user.role] || 0) + 1;
  statusStats[user.status] = (statusStats[user.status] || 0) + 1;
});

console.log('📊 Статистика по ролям:', roleStats);
console.log('📊 Статистика по статусам:', statusStats);
