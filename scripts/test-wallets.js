const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWallets() {
  try {
    console.log('🔍 Поиск пользователей...');
    
    // Находим первого пользователя для тестирования
    const user = await prisma.users.findFirst();
    
    if (!user) {
      console.log('❌ Пользователи не найдены. Сначала создайте пользователя.');
      return;
    }
    
    console.log(`✅ Найден пользователь: ${user.name} (${user.email})`);
    
    // Проверяем существующие кошельки
    const existingWallets = await prisma.user_wallets.findMany({
      where: { userId: user.id }
    });
    
    console.log(`📊 Найдено кошельков: ${existingWallets.length}`);
    
    if (existingWallets.length > 0) {
      console.log('📋 Существующие кошельки:');
      existingWallets.forEach(wallet => {
        console.log(`  - ${wallet.network}: ${wallet.address}${wallet.label ? ` (${wallet.label})` : ''}`);
      });
    }
    
    // Создаем тестовый кошелек
    console.log('\n➕ Создание тестового кошелька...');
    
    const testWallet = await prisma.user_wallets.create({
      data: {
        userId: user.id,
        network: 'BTC',
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        label: 'Тестовый BTC кошелек'
      }
    });
    
    console.log(`✅ Создан кошелек: ${testWallet.network} - ${testWallet.address}`);
    
    // Проверяем, что кошелек создался
    const createdWallet = await prisma.user_wallets.findUnique({
      where: { id: testWallet.id }
    });
    
    if (createdWallet) {
      console.log('✅ Кошелек успешно сохранен в базе данных');
      console.log(`  ID: ${createdWallet.id}`);
      console.log(`  Сеть: ${createdWallet.network}`);
      console.log(`  Адрес: ${createdWallet.address}`);
      console.log(`  Метка: ${createdWallet.label || 'Нет'}`);
      console.log(`  Активен: ${createdWallet.isActive}`);
      console.log(`  Создан: ${createdWallet.createdAt}`);
    }
    
    // Проверяем связь с пользователем
    const userWithWallets = await prisma.users.findUnique({
      where: { id: user.id },
      include: { wallets: true }
    });
    
    console.log(`\n🔗 Связь с пользователем: ${userWithWallets.wallets.length} кошельков`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWallets();
