#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔄 Сброс пароля администратора...');
    
    const email = 'admin@umbra-platform.dev';
    const newPassword = 'admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Находим админа
    const admin = await prisma.users.findUnique({
      where: { email }
    });
    
    if (!admin) {
      console.log('❌ Администратор не найден!');
      console.log('💡 Запустите: node scripts/create-admin.js');
      return;
    }
    
    // Обновляем пароль
    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Пароль администратора успешно сброшен!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Новый пароль: ${newPassword}`);
    console.log('⚠️  Рекомендуется изменить пароль после входа');
    
  } catch (error) {
    console.error('❌ Ошибка сброса пароля:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();

