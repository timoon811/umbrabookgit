const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOrUpdatePage4() {
  try {
    console.log('🔍 Проверяем существование страницы page-4...');

    let page4 = await prisma.documentation.findFirst({
      where: { slug: 'page-4' }
    });

    if (page4) {
      console.log('📄 Страница page-4 уже существует:', page4.title);

      // Обновляем её, чтобы сделать опубликованной и первой
      await prisma.documentation.update({
        where: { id: page4.id },
        data: {
          isPublished: true,
          order: -1, // Делаем первой по порядку
          title: 'Добро пожаловать в Umbra Platform'
        }
      });
      console.log('✅ Страница page-4 обновлена и сделана первой');
    } else {
      console.log('📝 Создаем новую страницу page-4...');

      // Получаем ID секции welcome
      const welcomeSection = await prisma.documentation_sections.findFirst({
        where: { key: 'welcome' }
      });

      if (!welcomeSection) {
        console.error('❌ Секция welcome не найдена');
        return;
      }

      page4 = await prisma.documentation.create({
        data: {
          title: 'Добро пожаловать в Umbra Platform',
          description: 'Главная страница документации Umbra Platform',
          slug: 'page-4',
          content: `# Добро пожаловать в Umbra Platform

Umbra Platform - это мощная платформа для разработчиков и аналитиков.

## Основные возможности

- **Документация**: Полная база знаний
- **Курсы**: Обучающие материалы
- **API**: Программный интерфейс
- **Аналитика**: Инструменты анализа

## Быстрый старт

1. Изучите документацию
2. Пройдите курсы
3. Начните использовать API

Добро пожаловать! 🚀`,
          sectionId: welcomeSection.id,
          order: -1, // Делаем первой
          isPublished: true
        }
      });

      console.log('✅ Создана новая страница page-4:', page4.title);
    }

    // Проверяем все страницы после изменений
    const allDocs = await prisma.documentation.findMany({
      where: { isPublished: true },
      select: { title: true, slug: true, order: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log('\n📋 Обновленный список страниц:');
    allDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (slug: ${doc.slug}, order: ${doc.order})`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

createOrUpdatePage4();
