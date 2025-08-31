const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

async function generateAdminToken() {
  try {
    console.log('🔄 Генерация JWT токена для администратора...');

    // Ищем администратора в базе данных
    const admin = await prisma.users.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!admin) {
      console.log('❌ Администратор не найден в базе данных');
      return;
    }

    console.log('👤 Найден администратор:', admin);

    // Создаем JWT токен
    const token = jwt.sign(
      {
        userId: admin.id,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log('✅ JWT токен сгенерирован');
    console.log('🔑 Токен:', token);

    // Тестируем проверку роли
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 Декодированный токен:', decoded);

    // Проверяем роль
    const isAdmin = decoded.role === "ADMIN";
    console.log('🔍 Проверка роли:', { role: decoded.role, isAdmin });

    // Показываем команду для curl с токеном
    console.log('\n📋 Команда для тестирования:');
    console.log(`curl -H "Cookie: auth-token=${token}" -I http://localhost:3001/admin`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

generateAdminToken();
