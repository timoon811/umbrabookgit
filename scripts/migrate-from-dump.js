const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Функция для парсинга .dat файлов PostgreSQL
function parseDatFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const data = [];
  
  for (const line of lines) {
    if (line.trim() === '' || line.startsWith('\\.') || line.includes('||')) {
      continue; // Пропускаем пустые строки и служебные
    }
    
    // Парсим строку формата: "column1\tcolumn2\tcolumn3..."
    const columns = line.split('\t');
    if (columns.length > 1) {
      data.push(columns);
    }
  }
  
  return data;
}

// Маппинг данных документации секций из дампа
function mapDocumentationSections(data) {
  return data.map(row => ({
    id: row[0],
    name: row[1],
    key: row[2],
    description: row[3] === '\\N' ? null : row[3],
    order: parseInt(row[4]) || 0,
    isVisible: row[5] === 't',
    createdAt: new Date(row[6]),
    updatedAt: new Date(row[7])
  }));
}

// Маппинг данных документации страниц из дампа
function mapDocumentationPages(data) {
  return data.map(row => ({
    id: row[0],
    title: row[1],
    description: row[2] === '\\N' ? null : row[2],
    slug: row[3],
    content: row[4] === '\\N' ? null : row[4],
    blocks: row[5] === '\\N' ? null : row[5],
    sectionId: row[6],
    order: parseInt(row[7]) || 0,
    isPublished: row[8] === 't',
    parentId: row[9] === '\\N' ? null : row[9],
    createdAt: new Date(row[10]),
    updatedAt: new Date(row[11])
  }));
}

// Маппинг пользователей из дампа
function mapUsers(data) {
  return data.map(row => {
    let role = row[5];
    // Маппим роли из старой системы к новой
    if (role === 'PROCESSOR') {
      role = 'PROCESSOR';
    } else if (role === 'ADMIN') {
      role = 'ADMIN';
    } else if (role === 'USER') {
      role = 'USER';
    } else {
      role = 'USER'; // По умолчанию
    }

    return {
      id: row[0],
      email: row[1],
      name: row[2],
      password: row[3], // Уже хешированный
      telegram: row[4],
      role: role,
      status: row[6],
      isBlocked: row[7] === 't',
      createdAt: new Date(row[8]),
      updatedAt: new Date(row[9])
    };
  });
}

// Маппинг финансовых аккаунтов
function mapFinanceAccounts(data) {
  return data.map(row => ({
    id: row[0],
    name: row[1],
    type: row[2],
    currency: row[3],
    balance: parseFloat(row[4]) || 0,
    commission: parseFloat(row[5]) || 0,
    cryptocurrencies: row[6] === '\\N' ? null : row[6],
    isArchived: row[7] === 't',
    createdAt: new Date(row[8]),
    updatedAt: new Date(row[9])
  }));
}

// Маппинг контрагентов
function mapFinanceCounterparties(data) {
  return data.map(row => ({
    id: row[0],
    name: row[1],
    type: row[2],
    email: row[3] === '\\N' ? null : row[3],
    phone: row[4] === '\\N' ? null : row[4],
    address: row[5] === '\\N' ? null : row[5],
    taxNumber: row[6] === '\\N' ? null : row[6],
    bankDetails: row[7] === '\\N' ? null : row[7],
    isArchived: row[8] === 't',
    createdAt: new Date(row[9]),
    updatedAt: new Date(row[10])
  }));
}

// Маппинг финансовых категорий
function mapFinanceCategories(data) {
  return data.map(row => ({
    id: row[0],
    name: row[1],
    type: row[2],
    description: row[3] === '\\N' ? null : row[3],
    color: row[4],
    isArchived: row[5] === 't',
    createdAt: new Date(row[6]),
    updatedAt: new Date(row[7])
  }));
}

// Маппинг финансовых проектов
function mapFinanceProjects(data) {
  return data.map(row => ({
    id: row[0],
    name: row[1],
    description: row[2] === '\\N' ? null : row[2],
    status: row[3],
    startDate: row[4] === '\\N' ? null : new Date(row[4]),
    endDate: row[5] === '\\N' ? null : new Date(row[5]),
    budget: row[6] === '\\N' ? null : parseFloat(row[6]),
    isArchived: row[7] === 't',
    createdAt: new Date(row[8]),
    updatedAt: new Date(row[9])
  }));
}

// Маппинг финансовых транзакций
function mapFinanceTransactions(data) {
  return data.map(row => ({
    id: row[0],
    accountId: row[1],
    counterpartyId: row[2] === '\\N' ? null : row[2],
    categoryId: row[3] === '\\N' ? null : row[3],
    projectId: row[4] === '\\N' ? null : row[4],
    projectKey: row[5] === '\\N' ? null : row[5],
    type: row[6],
    amount: parseFloat(row[7]) || 0,
    commissionPercent: parseFloat(row[8]) || 0,
    commissionAmount: parseFloat(row[9]) || 0,
    netAmount: parseFloat(row[10]) || 0,
    originalAmount: parseFloat(row[11]) || 0,
    description: row[12] === '\\N' ? null : row[12],
    date: new Date(row[13]),
    createdAt: new Date(row[14]),
    updatedAt: new Date(row[15])
  }));
}

async function main() {
  console.log('🚀 Начинаем миграцию данных из дампа...');
  
  const dumpPath = '2025-09-14T13:41Z/umbra_platform_db_new_km8e_rsmj/';
  
  try {
    // 1. Создаем основной проект контента
    console.log('📂 Создаем проект контента для документации...');
    
    let documentationProject = await prisma.content_projects.findFirst({
      where: { name: 'Umbra Platform Документация' }
    });
    
    if (!documentationProject) {
      documentationProject = await prisma.content_projects.create({
        data: {
          name: 'Umbra Platform Документация',
          description: 'Основная документация платформы, перенесенная из старой системы',
          type: 'documentation',
          isActive: true
        }
      });
    }
    
    console.log('✅ Проект контента создан:', documentationProject.name);

    // 2. Мигрируем пользователей
    console.log('👥 Мигрируем пользователей...');
    const usersData = parseDatFile(path.join(dumpPath, '3753.dat'));
    const users = mapUsers(usersData);
    
    for (const user of users) {
      await prisma.users.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log(`✅ Перенесено ${users.length} пользователей`);

    // 3. Мигрируем разделы документации
    console.log('📚 Мигрируем разделы документации...');
    const sectionsData = parseDatFile(path.join(dumpPath, '3757.dat'));
    const sections = mapDocumentationSections(sectionsData);
    
    for (const section of sections) {
      await prisma.documentation_sections.upsert({
        where: { id: section.id },
        update: {
          ...section,
          projectId: documentationProject.id // Привязываем к проекту
        },
        create: {
          ...section,
          projectId: documentationProject.id
        }
      });
    }
    console.log(`✅ Перенесено ${sections.length} разделов документации`);

    // 4. Мигрируем страницы документации
    console.log('📄 Мигрируем страницы документации...');
    const pagesData = parseDatFile(path.join(dumpPath, '3758.dat'));
    const pages = mapDocumentationPages(pagesData);
    
    for (const page of pages) {
      await prisma.documentation.upsert({
        where: { id: page.id },
        update: page,
        create: page
      });
    }
    console.log(`✅ Перенесено ${pages.length} страниц документации`);

    // 5. Мигрируем финансовые аккаунты
    console.log('💰 Мигрируем финансовые аккаунты...');
    const accountsData = parseDatFile(path.join(dumpPath, '3759.dat'));
    if (accountsData.length > 0) {
      const accounts = mapFinanceAccounts(accountsData);
      
      for (const account of accounts) {
        await prisma.finance_accounts.upsert({
          where: { id: account.id },
          update: account,
          create: account
        });
      }
      console.log(`✅ Перенесено ${accounts.length} финансовых аккаунтов`);
    } else {
      console.log('ℹ️ Финансовые аккаунты: файл пустой, пропускаем');
    }

    // 6. Мигрируем контрагентов
    console.log('🏢 Мигрируем контрагентов...');
    const counterpartiesData = parseDatFile(path.join(dumpPath, '3760.dat'));
    if (counterpartiesData.length > 0) {
      const counterparties = mapFinanceCounterparties(counterpartiesData);
      
      for (const counterparty of counterparties) {
        await prisma.finance_counterparties.upsert({
          where: { id: counterparty.id },
          update: counterparty,
          create: counterparty
        });
      }
      console.log(`✅ Перенесено ${counterparties.length} контрагентов`);
    } else {
      console.log('ℹ️ Контрагенты: файл пустой, пропускаем');
    }

    // 7. Мигрируем финансовые категории
    console.log('🏷️ Мигрируем финансовые категории...');
    const categoriesData = parseDatFile(path.join(dumpPath, '3761.dat'));
    if (categoriesData.length > 0) {
      const categories = mapFinanceCategories(categoriesData);
      
      for (const category of categories) {
        await prisma.finance_categories.upsert({
          where: { id: category.id },
          update: category,
          create: category
        });
      }
      console.log(`✅ Перенесено ${categories.length} финансовых категорий`);
    } else {
      console.log('ℹ️ Финансовые категории: файл пустой, пропускаем');
    }

    // 8. Мигрируем финансовые проекты
    console.log('📋 Мигрируем финансовые проекты...');
    const financeProjectsData = parseDatFile(path.join(dumpPath, '3762.dat'));
    if (financeProjectsData.length > 0) {
      const financeProjects = mapFinanceProjects(financeProjectsData);
      
      for (const project of financeProjects) {
        await prisma.finance_projects.upsert({
          where: { id: project.id },
          update: project,
          create: project
        });
      }
      console.log(`✅ Перенесено ${financeProjects.length} финансовых проектов`);
    } else {
      console.log('ℹ️ Финансовые проекты: файл пустой, пропускаем');
    }

    // 9. Мигрируем финансовые транзакции
    console.log('💸 Мигрируем финансовые транзакции...');
    const transactionsData = parseDatFile(path.join(dumpPath, '3763.dat'));
    if (transactionsData.length > 0) {
      const transactions = mapFinanceTransactions(transactionsData);
      
      for (const transaction of transactions) {
        await prisma.finance_transactions.upsert({
          where: { id: transaction.id },
          update: transaction,
          create: transaction
        });
      }
      console.log(`✅ Перенесено ${transactions.length} финансовых транзакций`);
    } else {
      console.log('ℹ️ Финансовые транзакции: файл пустой, пропускаем');
    }

    console.log('');
    console.log('🎉 Миграция завершена успешно!');
    console.log('📊 Статистика миграции:');
    console.log(`   - Пользователи: ${users.length}`);
    console.log(`   - Разделы документации: ${sections.length}`);
    console.log(`   - Страницы документации: ${pages.length}`);
    console.log(`   - Финансовые аккаунты: ${accountsData.length > 0 ? 'Перенесено' : 'Пропущено (пустой файл)'}`);
    console.log(`   - Контрагенты: ${counterpartiesData.length > 0 ? 'Перенесено' : 'Пропущено (пустой файл)'}`);
    console.log(`   - Финансовые категории: ${categoriesData.length > 0 ? 'Перенесено' : 'Пропущено (пустой файл)'}`);
    console.log(`   - Финансовые проекты: ${financeProjectsData.length > 0 ? 'Перенесено' : 'Пропущено (пустой файл)'}`);
    console.log(`   - Финансовые транзакции: ${transactionsData.length > 0 ? 'Перенесено' : 'Пропущено (пустой файл)'}`);
    console.log('');
    console.log('🔗 Все разделы документации привязаны к проекту:', documentationProject.name);

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
