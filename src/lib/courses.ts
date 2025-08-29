export type CourseNavItem = { title: string; href: string; depth?: number };
export type CourseNavSection = { title: string; sectionKey: string; items: CourseNavItem[] };

export type CourseTocItem = { depth: number; text: string; id: string };

// Получаем название для раздела курсов
export function getCourseSectionInfo(sectionKey: string): { name: string; description: string } {
  const sectionNames: Record<string, string> = {
    'general': 'Общие курсы',
    'beginner': 'Для начинающих',
    'intermediate': 'Средний уровень',
    'advanced': 'Продвинутый уровень',
    'certification': 'Сертификация',
    'api': 'API и интеграции',
    'security': 'Безопасность',
    'analytics': 'Аналитика и отчеты',
  };

  const sectionDescriptions: Record<string, string> = {
    'general': 'Общие курсы по платформе Umbra',
    'beginner': 'Курсы для новичков в платформе',
    'intermediate': 'Курсы среднего уровня сложности',
    'advanced': 'Продвинутые курсы для экспертов',
    'certification': 'Курсы для получения сертификации',
    'api': 'Курсы по работе с API и интеграциям',
    'security': 'Курсы по безопасности платформы',
    'analytics': 'Курсы по аналитике и отчетам',
  };

  return {
    name: sectionNames[sectionKey] || sectionKey,
    description: sectionDescriptions[sectionKey] || 'Курс по данной теме'
  };
}

// Функция получения навигации для курсов из базы данных
export async function getCoursesNav(workspaceKey?: string): Promise<CourseNavSection[]> {
  try {
    // Импортируем prisma только на сервере
    const { prisma } = await import('@/lib/prisma');
    
    // Принудительно обновляем кэш для получения актуальных данных
    await prisma.$queryRaw`SELECT 1`;

    // Получаем все опубликованные курсы
    const courses = await prisma.courses.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        createdAt: true,
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Группируем курсы по категориям
    const sectionMap = new Map<string, CourseNavItem[]>();

    courses.forEach(course => {
      const section = course.category || 'general';
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }

      sectionMap.get(section)!.push({
        title: course.title,
        href: `/courses/${course.slug}`,
        depth: 1,
      });
    });

    // Создаем секции с правильными названиями и группировкой
    const sections: CourseNavSection[] = [];

    // Определяем порядок разделов для лучшей организации
    const sectionOrder = [
      'beginner',
      'intermediate',
      'advanced',
      'api',
      'security',
      'analytics',
      'certification',
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
      
      // Сортируем курсы внутри раздела по дате создания
      const sortedItems = items.sort((a, b) => {
        return 0; // Все курсы имеют одинаковую глубину
      });

      // Используем информацию о разделе из getCourseSectionInfo
      const sectionInfo = getCourseSectionInfo(sectionKey);

      sections.push({
        title: sectionInfo.name,
        sectionKey: sectionKey,
        items: sortedItems,
      });
    });

    return sections;
  } catch (error) {
    console.error("Error loading courses navigation:", error);
    return [];
  }
}

// Функция для генерации ID аналогично rehype-slug с сохранением кириллицы
function generateSlugId(text: string): string {
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

export function extractCourseHeadingsForToc(content: string): CourseTocItem[] {
  const lines = content.split(/\r?\n/);
  const items: CourseTocItem[] = [];
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (m) {
      const depth = m[1].length;
      const text = m[2].trim();
      const id = generateSlugId(text);
      items.push({ depth, text, id });
    }
  }
  return items;
}
