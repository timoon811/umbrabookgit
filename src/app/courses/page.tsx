import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCourseSectionInfo, getCoursesNav } from "@/lib/courses";
import SearchBox from "@/components/SearchBox";

interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getCoursesData() {
  try {
    // Принудительно обновляем кэш для получения актуальных данных
    await prisma.$queryRaw`SELECT 1`;
    
    const courses = await prisma.courses.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        sections: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            pages: {
              where: {
                isPublished: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Обогащаем данные курсов
    const enrichedCourses = courses.map(course => {
      const totalSections = course.sections.length;
      const totalPages = course.sections.reduce((sum, section) => sum + section.pages.length, 0);

      return {
        ...course,
        totalSections,
        totalPages,
        difficulty: course.category === 'beginner' ? 'Начинающий' :
                   course.category === 'intermediate' ? 'Средний' : 'Продвинутый',
        estimatedDuration: `${Math.max(2, Math.floor(totalPages * 0.5))} часов`,
        rating: 4.5 + Math.random() * 0.5,
      };
    });

    return enrichedCourses;
  } catch (error) {
    console.error("Error loading courses:", error);
    return [];
  }
}

interface CoursesPageProps {
  searchParams: Promise<{
    section?: string;
    q?: string;
  }>;
}

export default async function CoursesIndexPage({ searchParams }: CoursesPageProps) {
  const courses = await getCoursesData();
  const searchParamsResolved = await searchParams;
  const selectedSection = searchParamsResolved.section;
  const searchQuery = searchParamsResolved.q;

  // Фильтруем по разделу и поисковому запросу
  let filteredCourses = courses;
  
  if (selectedSection && selectedSection !== 'all') {
    filteredCourses = filteredCourses.filter(course => course.category === selectedSection);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredCourses = filteredCourses.filter(course => 
      course.title.toLowerCase().includes(query) ||
      (course.description && course.description.toLowerCase().includes(query))
    );
  }

  // Получаем информацию о разделе
  const sectionInfo = selectedSection ? getCourseSectionInfo(selectedSection) : null;

  // Получаем навигацию для отображения всех разделов
  const navSections = await getCoursesNav('courses');

  // Статистика
  const totalCourses = courses.length;
  const beginnerCourses = courses.filter(c => c.category === 'beginner').length;
  const intermediateCourses = courses.filter(c => c.category === 'intermediate').length;
  const advancedCourses = courses.filter(c => c.category === 'advanced').length;

  return (
    <div className="space-y-8" suppressHydrationWarning>
      {selectedSection && selectedSection !== 'all' ? (
        // Показываем конкретный раздел
        <div>
          {/* Хлебные крошки */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link
              href="/courses"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Курсы
            </Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-300">
              {sectionInfo?.name || selectedSection}
            </span>
          </nav>

          {/* Заголовок раздела */}
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {sectionInfo ? sectionInfo.name : selectedSection}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {sectionInfo?.description || 'Курсы по данному разделу'}
              </p>
            </div>

            {/* Поиск в разделе */}
            <div className="max-w-md">
              <SearchBox />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Курсы не найдены</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {searchQuery 
                  ? `По запросу "${searchQuery}" в этом разделе ничего не найдено`
                  : 'В этом разделе пока нет курсов'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                >
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Изучать курс
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
        // Главная страница курсов
        <div className="text-center">
          {/* Hero секция */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Курсы Umbra Platform
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Изучайте платформу Umbra с помощью структурированных курсов. 
              От базовых концепций до продвинутых интеграций - у нас есть курс для каждого уровня.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


