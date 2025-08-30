const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDocumentation() {
  try {
    console.log('🔍 Проверка существующей документации...');

    // Проверяем, есть ли уже документация
    const existingDocs = await prisma.documentation.findMany({
      where: { isPublished: true }
    });

    if (existingDocs.length > 0) {
      console.log(`✅ Найдено ${existingDocs.length} опубликованных страниц документации`);
      existingDocs.forEach(doc => {
        console.log(`  - ${doc.title} (slug: ${doc.slug})`);
      });
      return;
    }

    console.log('📝 Создание тестовой документации...');

    // Создаем секцию, если её нет
    let welcomeSection = await prisma.documentation_sections.findFirst({
      where: { key: 'welcome' }
    });

    if (!welcomeSection) {
      welcomeSection = await prisma.documentation_sections.create({
        data: {
          name: 'Добро пожаловать',
          key: 'welcome',
          description: 'Основная информация о платформе',
          order: 0,
          isVisible: true
        }
      });
      console.log('✅ Создана секция "Добро пожаловать"');
    }

    // Создаем тестовую страницу
    const welcomePage = await prisma.documentation.create({
      data: {
        title: 'Добро пожаловать в Umbra Platform',
        description: 'Основная информация о платформе для разработчиков',
        slug: 'welcome',
        content: `# Добро пожаловать в Umbra Platform

Umbra Platform - это мощная платформа для разработчиков и аналитиков, которая предоставляет полный набор инструментов для эффективной работы.

## Основные возможности

- **Документация**: Полная база знаний по использованию платформы
- **Курсы**: Обучающие материалы для новичков и экспертов
- **API**: Мощный программный интерфейс для интеграции
- **Аналитика**: Инструменты для анализа данных и отчетности

## Быстрый старт

1. Ознакомьтесь с документацией
2. Пройдите обучающие курсы
3. Начните использовать API
4. Анализируйте данные

---

*Приятного использования платформы! 🚀*`,
        blocks: null,
        sectionId: welcomeSection.id,
        order: 0,
        isPublished: true
      }
    });

    console.log(`✅ Создана тестовая страница: ${welcomePage.title} (slug: ${welcomePage.slug})`);

    // Создаем еще одну тестовую страницу
    const aboutPage = await prisma.documentation.create({
      data: {
        title: 'О платформе',
        description: 'Подробная информация о Umbra Platform',
        slug: 'about',
        content: `# О Umbra Platform

## Наша миссия

Umbra Platform создана для того, чтобы сделать процесс разработки и анализа максимально эффективным и удобным.

## Компоненты платформы

### 1. Система документации
- Полная база знаний
- Поиск по контенту
- Структурированная навигация

### 2. Обучающая платформа
- Курсы для всех уровней
- Практические задания
- Сертификаты

### 3. API и интеграции
- RESTful API
- WebSocket для реального времени
- SDK для популярных языков

## Безопасность

Платформа использует современные стандарты безопасности:
- JWT токены для аутентификации
- Шифрование данных
- Аудит действий пользователей`,
        blocks: null,
        sectionId: welcomeSection.id,
        order: 1,
        isPublished: true
      }
    });

    console.log(`✅ Создана тестовая страница: ${aboutPage.title} (slug: ${aboutPage.slug})`);

    console.log('\n🎉 Тестовая документация успешно создана!');
    console.log('Теперь вы можете перейти на /docs для просмотра документации.');

  } catch (error) {
    console.error('❌ Ошибка при создании документации:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDocumentation();
