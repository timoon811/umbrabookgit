const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateDocsForProduction() {
  try {
    console.log('🚀 Начинаем миграцию документации для продакшена...');

    // Проверяем, существует ли уже страница page-4
    const existingPage4 = await prisma.documentation.findFirst({
      where: { slug: 'page-4' }
    });

    if (existingPage4) {
      console.log('✅ Страница page-4 уже существует');

      // Обновляем её на всякий случай
      await prisma.documentation.update({
        where: { id: existingPage4.id },
        data: {
          isPublished: true,
          order: -1,
          title: 'Добро пожаловать в Umbra Platform',
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

Добро пожаловать! 🚀`
        }
      });

      console.log('✅ Страница page-4 обновлена');
    } else {
      console.log('📝 Создаем страницу page-4...');

      // Получаем ID секции welcome
      const welcomeSection = await prisma.documentation_sections.findFirst({
        where: { key: 'welcome' }
      });

      if (!welcomeSection) {
        console.error('❌ Секция welcome не найдена. Создаем её...');

        const newSection = await prisma.documentation_sections.create({
          data: {
            name: 'Добро пожаловать',
            key: 'welcome',
            description: 'Основная информация о платформе',
            order: 0,
            isVisible: true
          }
        });

        console.log('✅ Создана секция welcome');

        await prisma.documentation.create({
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
            sectionId: newSection.id,
            order: -1,
            isPublished: true
          }
        });
      } else {
        await prisma.documentation.create({
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
            order: -1,
            isPublished: true
          }
        });
      }

      console.log('✅ Создана страница page-4');
    }

    // Проверяем все опубликованные страницы
    const allPublishedDocs = await prisma.documentation.findMany({
      where: { isPublished: true },
      select: { title: true, slug: true, order: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log('\n📋 Финальный список опубликованных страниц:');
    allPublishedDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (slug: ${doc.slug}, order: ${doc.order})`);
    });

    const firstPage = allPublishedDocs[0];
    if (firstPage && firstPage.slug === 'page-4') {
      console.log('\n✅ УСПЕХ: Первая страница - page-4, как и ожидалось!');
    } else {
      console.log('\n❌ ПРОБЛЕМА: Первая страница не page-4!');
    }

    await prisma.$disconnect();
    console.log('\n🎉 Миграция завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
    process.exit(1);
  }
}

migrateDocsForProduction();
