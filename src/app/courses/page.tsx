"use client";

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
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      {selectedSection && selectedSection !== 'all' ? (
        // Показываем конкретный раздел
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/courses"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Курсы
            </Link>
            <span className="text-gray-400">/</span>
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
      
              <span>{sectionInfo?.name || selectedSection}</span>
            </span>
          </div>

          {/* Поиск по курсам */}
          <div className="mb-8">
            <div className="max-w-lg">
              <SearchBox />
            </div>
          </div>
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {sectionInfo ? sectionInfo.name : selectedSection}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {sectionInfo?.description || 'Курсы по данному разделу'}
            </p>
          </div>



          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Курсы не найдены</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery 
                  ? `По запросу "${searchQuery}" в этом разделе ничего не найдено`
                  : 'В этом разделе пока нет курсов'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="block bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {course.description || 'Описание курса скоро будет добавлено'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{new Date(course.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span className="text-gray-600 dark:text-gray-400">Изучать →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Главная страница курсов
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            🎓 Курсы обучения Umbra Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Изучайте платформу Umbra с помощью структурированных курсов. 
            От базовых концепций до продвинутых интеграций - у нас есть курс для каждого уровня.
          </p>
          
          {/* Поиск по всем курсам */}
          <div className="mb-12">
            <div className="max-w-lg mx-auto">
              <SearchBox />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Ищите по названиям и описаниям курсов
            </p>
          </div>
          


          {/* Краткая статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">{totalCourses}</div>
              <div className="text-gray-600 dark:text-gray-400">Всего курсов</div>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{beginnerCourses}</div>
              <div className="text-gray-600 dark:text-gray-400">Для начинающих</div>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{intermediateCourses}</div>
              <div className="text-gray-600 dark:text-gray-400">Средний уровень</div>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{advancedCourses}</div>
              <div className="text-gray-600 dark:text-gray-400">Продвинутый</div>
            </div>
          </div>

          {/* Обзор разделов */}
          {navSections.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Обзор разделов
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {navSections.map((section) => (
                  <div
                    key={section.sectionKey}
                    className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6 text-center"
                  >
                    <div className="text-2xl mb-2">
                      
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {getCourseSectionInfo(section.sectionKey).description}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {section.items.length} курсов
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


