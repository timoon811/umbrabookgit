
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSectionInfo, getDocsNav } from "@/lib/docs";
import SearchBox from "@/components/SearchBox";

interface DocumentationPage {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  section: string;
  order: number;
  isPublished: boolean;
  content?: string | null;
}

async function getDocumentationData() {
  try {
    // Принудительно обновляем кэш для получения актуальных данных
    await prisma.$queryRaw`SELECT 1`;
    
    const pages = await prisma.documentation.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        sectionId: true,
        order: true,
        content: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Получаем информацию о разделах отдельно
    const sections = await prisma.documentation_sections.findMany({
      select: {
        id: true,
        name: true,
        key: true,
      }
    });

    // Объединяем данные
    const pagesWithSections = pages.map((page: any) => ({
      ...page,
      sectionInfo: sections.find((s: any) => s.id === page.sectionId) || null
    }));

    return pagesWithSections;
  } catch (error) {
    console.error("Error loading documentation:", error);
    return [];
  }
}

interface DocsPageProps {
  searchParams: Promise<{
    section?: string;
    q?: string;
  }>;
}

export default async function DocsIndexPage({ searchParams }: DocsPageProps) {
  const pages = await getDocumentationData();
  const searchParamsResolved = await searchParams;
  const selectedSection = searchParamsResolved.section;
  const searchQuery = searchParamsResolved.q;

  // Фильтруем по разделу и поисковому запросу
  let filteredPages = pages;
  
  if (selectedSection && selectedSection !== 'all') {
    // Фильтруем по ID раздела или по ключу раздела
    filteredPages = filteredPages.filter((page: any) => {
      const pageSection = page.sectionInfo;
      if (!pageSection) return false;
      
      return pageSection.id === selectedSection || pageSection.key === selectedSection;
    });
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPages = filteredPages.filter((page: any) => 
      page.title.toLowerCase().includes(query) ||
      (page.description && page.description.toLowerCase().includes(query)) ||
      (page.content && page.content.toLowerCase().includes(query))
    );
  }

  // Получаем информацию о разделе
  let sectionInfo = null;
  if (selectedSection && selectedSection !== 'all') {
    // Находим раздел по ID или ключу
    const section = await prisma.documentation_sections.findFirst({
      where: {
        OR: [
          { id: selectedSection },
          { key: selectedSection }
        ]
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
      }
    });
    
    if (section) {
      sectionInfo = {
        name: section.name,
        description: section.description || 'Документация по данному разделу'
      };
    }
  }
  
  // Стабилизируем данные для предотвращения гидратации
  const stablePages = filteredPages.map((page: any) => ({
    ...page,
    id: String(page.id || ''),
    title: String(page.title || ''),
    description: page.description ? String(page.description) : null,
    slug: String(page.slug || ''),
    sectionId: String(page.sectionId || ''),
    order: Number(page.order || 0),
    content: page.content ? String(page.content) : null,
  }));
  
  const stableSectionInfo = sectionInfo ? {
    name: String(sectionInfo.name || ''),
    
    description: String(sectionInfo.description || ''),
  } : null;

  // Получаем навигацию для отображения всех разделов
  const navSections = await getDocsNav('docs');



  return (
    <div className="space-y-8" suppressHydrationWarning>
      {selectedSection && selectedSection !== 'all' ? (
        // Показываем конкретный раздел
        <div>
          {/* Хлебные крошки */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link
              href="/docs"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Документация
            </Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-300">
              {stableSectionInfo?.name || selectedSection || 'Раздел'}
            </span>
          </nav>

          {/* Заголовок раздела */}
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stableSectionInfo?.name || selectedSection || 'Раздел'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {stableSectionInfo?.description || 'Документация по данному разделу'}
              </p>
            </div>

            {/* Поиск в разделе */}
            <div className="max-w-md">
              <SearchBox />
            </div>
          </div>

          {stablePages.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Страницы не найдены</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {searchQuery 
                  ? `По запросу "${searchQuery}" в этом разделе ничего не найдено`
                  : 'В этом разделе пока нет страниц'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stablePages.map((page: any, index: number) => (
                <Link
                  key={page.id || `page-${index}`}
                  href={`/docs/${page.slug || '#'}`}
                  className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                >
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {page.title || 'Без названия'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {page.description || 'Описание страницы скоро будет добавлено'}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Читать документацию
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Главная страница документации
        <div className="text-center">
          {/* Hero секция */}
          <div className="mb-12">

            
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Документация Umbra Platform
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Изучайте платформу Umbra с помощью подробной документации. 
              От базовых концепций до продвинутых интеграций - у нас есть ответы на все вопросы.
            </p>
            

          </div>


        </div>
      )}
    </div>
  );
}
