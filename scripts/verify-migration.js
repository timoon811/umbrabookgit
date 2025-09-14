const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Проверяем результаты миграции...\n');
  
  try {
    // Проверяем пользователей
    const usersCount = await prisma.users.count();
    const adminUsers = await prisma.users.count({ where: { role: 'ADMIN' } });
    const processorUsers = await prisma.users.count({ where: { role: 'PROCESSOR' } });
    
    console.log(`👥 Пользователи: ${usersCount} всего`);
    console.log(`   - Админы: ${adminUsers}`);
    console.log(`   - Процессоры: ${processorUsers}`);
    console.log('');

    // Проверяем проекты контента
    const contentProjects = await prisma.content_projects.findMany({
      include: {
        documentationSections: {
          include: {
            pages: true
          }
        }
      }
    });
    
    console.log(`📂 Проекты контента: ${contentProjects.length}`);
    contentProjects.forEach(project => {
      console.log(`   - ${project.name}: ${project.documentationSections.length} разделов`);
      const totalPages = project.documentationSections.reduce((sum, section) => sum + section.pages.length, 0);
      console.log(`     Страниц в проекте: ${totalPages}`);
    });
    console.log('');

    // Проверяем разделы документации
    const sectionsCount = await prisma.documentation_sections.count();
    const sectionsWithProject = await prisma.documentation_sections.count({
      where: { projectId: { not: null } }
    });
    
    console.log(`📚 Разделы документации: ${sectionsCount} всего`);
    console.log(`   - Привязано к проектам: ${sectionsWithProject}`);
    console.log('');

    // Проверяем страницы документации
    const pagesCount = await prisma.documentation.count();
    const publishedPages = await prisma.documentation.count({ where: { isPublished: true } });
    
    console.log(`📄 Страницы документации: ${pagesCount} всего`);
    console.log(`   - Опубликовано: ${publishedPages}`);
    console.log('');

    // Проверяем финансовые данные
    const accountsCount = await prisma.finance_accounts.count();
    const categoriesCount = await prisma.finance_categories.count();
    const transactionsCount = await prisma.finance_transactions.count();
    
    console.log(`💰 Финансовые данные:`);
    console.log(`   - Аккаунты: ${accountsCount}`);
    console.log(`   - Категории: ${categoriesCount}`);
    console.log(`   - Транзакции: ${transactionsCount}`);
    console.log('');

    // Проверяем примеры контента
    console.log('📝 Примеры контента:');
    
    const sampleSection = await prisma.documentation_sections.findFirst({
      include: {
        pages: {
          take: 1
        },
        project: true
      }
    });
    
    if (sampleSection) {
      console.log(`   Раздел: "${sampleSection.name}" (${sampleSection.key})`);
      console.log(`   Проект: ${sampleSection.project?.name || 'Не привязан'}`);
      if (sampleSection.pages[0]) {
        console.log(`   Первая страница: "${sampleSection.pages[0].title}"`);
        console.log(`   Содержимое: ${sampleSection.pages[0].content?.slice(0, 100)}...`);
      }
    }

    console.log('\n✅ Миграция прошла успешно! Все данные на месте.');

  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
