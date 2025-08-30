

export type NavItem = { title: string; href: string; depth?: number };
export type NavSection = { title: string; sectionKey: string; items: NavItem[] };

export type TocItem = { depth: number; text: string; id: string };

// Интерфейсы для типов данных из базы данных
interface DocItem {
  id: string;
  title: string;
  slug: string;
  sectionId: string;
  order: number;
  parentId?: string | null;
}

interface SectionItem {
  id: string;
  key: string;
  name: string;
}

// Получаем название для раздела
export function getSectionInfo(sectionKey: string): { name: string; description: string } {
  const sectionNames: Record<string, string> = {
    'general': 'Общие',
    'getting-started': 'Начало работы',
    'installation': 'Установка',
    'configuration': 'Конфигурация',
    'api-reference': 'API справочник',
    'examples': 'Примеры',
    'tutorials': 'Руководства',
    'faq': 'Частые вопросы',
    'troubleshooting': 'Решение проблем',
  };

  const sectionDescriptions: Record<string, string> = {
    'general': 'Общая информация и полезные материалы',
    'getting-started': 'Базовое руководство по началу работы с платформой',
    'installation': 'Пошаговая инструкция по установке и настройке',
    'configuration': 'Настройка и конфигурация системы',
    'api-reference': 'Полное описание API и методов интеграции',
    'examples': 'Практические примеры использования',
    'tutorials': 'Подробные руководства и туториалы',
    'faq': 'Часто задаваемые вопросы',
    'troubleshooting': 'Решение проблем и устранение неисправностей',
  };

  return {
    name: sectionNames[sectionKey] || sectionKey,
    description: sectionDescriptions[sectionKey] || 'Документация по данному разделу'
  };
}

// Функция получения навигации для документации из базы данных
export async function getDocsNav(workspaceKey?: string): Promise<NavSection[]> {
  try {
    // Импортируем prisma только на сервере
    const { prisma } = await import('@/lib/prisma');
    
    // Принудительно обновляем кэш для получения актуальных данных
    await prisma.$queryRaw`SELECT 1`;

    // Получаем все опубликованные документы
    const docs = await prisma.documentation.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        sectionId: true,
        order: true,
        parentId: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Получаем информацию о разделах
    const sections = await prisma.documentation_sections.findMany({
      select: {
        id: true,
        key: true,
        name: true,
      }
    });

    // Создаем мапу разделов для быстрого доступа
    const sectionsMap = new Map<string, SectionItem>(sections.map((s: SectionItem) => [s.id, s]));

    // Группируем документы по разделам
    const sectionMap = new Map<string, NavItem[]>();

    docs.forEach((doc: DocItem) => {
      const section = sectionsMap.get(doc.sectionId);
      const sectionKey = section?.key || 'general';
      
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, []);
      }

      sectionMap.get(sectionKey)!.push({
        title: doc.title,
        href: `/docs/${doc.slug}`,
        depth: doc.parentId ? 2 : 1,
      });
    });

    // Создаем секции с правильными названиями и группировкой
    const sectionsResult: NavSection[] = [];

    // Определяем порядок разделов для лучшей организации
    const sectionOrder = [
      'getting-started',
      'installation', 
      'configuration',
      'api-reference',
      'examples',
      'tutorials',
      'faq',
      'troubleshooting',
      'general'
    ];

    // Сортируем секции по заданному порядку
    const sortedSections = Array.from(sectionMap.keys()).sort((a, b) => {
      const aIndex = sectionOrder.indexOf(a);
      const bIndex = sectionOrder.indexOf(b);
      
      // Если оба раздела в списке порядка, сортируем по нему
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // Если только один в списке, он идет первым
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // Иначе сортируем по алфавиту
      return a.localeCompare(b);
    });

    sortedSections.forEach(sectionKey => {
      const items = sectionMap.get(sectionKey)!;
      
      // Сортируем страницы внутри раздела по порядку
      const sortedItems = items.sort((a, b) => {
        // Сначала показываем страницы без parentId (основные)
        if (a.depth === 1 && b.depth === 2) return -1;
        if (a.depth === 2 && b.depth === 1) return 1;
        return 0;
      });

      // Используем название раздела из базы данных, если доступно, иначе из статических данных
      const section = sections.find(s => s.key === sectionKey);
      const sectionName = section?.name || getSectionInfo(sectionKey).name;

      sectionsResult.push({
        title: sectionName,
        sectionKey: sectionKey,
        items: sortedItems,
      });
    });

    return sectionsResult;
  } catch (error) {
    console.error("❌ getDocsNav: Ошибка загрузки навигации документации:", error);
    
    // Попробуем упрощенный запрос в случае ошибки
    try {
      const { prisma } = await import('@/lib/prisma');
      const docs = await prisma.documentation.findMany({
        where: { isPublished: true },
        select: {
          title: true,
          slug: true,
        },
        orderBy: { order: 'asc' }
      });
      
      if (docs.length > 0) {
        console.log('🔄 getDocsNav: Возвращаем упрощенную навигацию с', docs.length, 'страницами');
        return [{
          title: 'Документация',
          sectionKey: 'general',
          items: docs.map(doc => ({
            title: doc.title,
            href: `/docs/${doc.slug}`,
            depth: 1
          }))
        }];
      }
    } catch (fallbackError) {
      console.error("❌ getDocsNav: Упрощенный запрос также провалился:", fallbackError);
    }
    
    // Возвращаем пустой массив в крайнем случае
    return [];
  }
}

// Функция для генерации ID аналогично rehype-slug с сохранением кириллицы
function generateSlugId(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    // Заменяем пробелы на дефисы
    .replace(/\s+/g, '-')
    // Убираем знаки препинания, но оставляем кириллицу, латиницу, цифры и дефисы
    .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
    // Убираем множественные дефисы
    .replace(/\-\-+/g, '-')
    // Убираем дефисы в начале и конце
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function extractHeadingsForToc(content: string): TocItem[] {
  if (!content || typeof content !== 'string') return [];
  
  const lines = content.split(/\r?\n/);
  const items: TocItem[] = [];
  const usedIds = new Set<string>();
  
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (m) {
      const depth = m[1].length;
      const text = m[2].trim();
      
      if (!text) continue;
      
      let id = generateSlugId(text);
      
      // Убеждаемся, что ID уникален
      let counter = 1;
      const originalId = id;
      while (usedIds.has(id)) {
        id = `${originalId}-${counter}`;
        counter++;
      }
      
      usedIds.add(id);
      
      items.push({ depth, text, id });
    }
  }
  
  return items;
}


