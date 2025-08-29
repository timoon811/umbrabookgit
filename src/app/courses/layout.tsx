import Link from "next/link";
import { getCoursesNav } from "@/lib/courses";
import TableOfContents from "@/components/TableOfContents";

interface CoursesLayoutProps {
  children: React.ReactNode;
  searchParams?: Promise<{ section?: string }>;
}

export default async function CoursesLayout({ children, searchParams }: CoursesLayoutProps) {
  // Получаем навигацию для курсов
  const nav = await getCoursesNav('courses');
  
  // Получаем текущий раздел из searchParams
  const resolvedSearchParams = await searchParams;
  const currentSection = resolvedSearchParams?.section;

  return (
    <div className="mx-auto max-w-screen-2xl px-6 lg:px-6 md:px-4 sm:px-3">
      <div className="grid layout-root">
        <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/10 sticky top-[calc(var(--header-height)+1rem)] h-[calc(100vh-var(--header-height)-2rem)] overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {/* Заголовок сайдбара */}
            <div className="p-6 pb-4 border-b border-black/5 dark:border-white/10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Курсы
              </h2>
            </div>
            
            {/* Навигация по разделам курсов */}
            <nav className="p-6 pt-4">
              {nav.length > 0 ? (
                <div className="space-y-8">
                  {nav.map((section, index) => (
                    <div key={`section-${section.sectionKey}-${index}`} className="docs-nav-section">
                      {/* Заголовок раздела - НЕ кликабельный, как в документации */}
                      <div className="docs-section-header">
                        <span className="section-title">{section.title.toUpperCase()}</span>
                      </div>
                      
                      {/* Курсы в разделе - кликабельные с правильными отступами */}
                      {section.items.length > 0 && (
                        <ul className="docs-page-list">
                          {section.items.map((item, itemIndex) => (
                            <li key={`item-${itemIndex}`} className="docs-page-item-wrapper">
                              <Link
                                href={item.href}
                                className={`docs-page-item ${currentSection === section.sectionKey ? 'active' : ''}`}
                              >
                                <span className="page-title">{item.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Нет доступных курсов
                  </p>
                </div>
              )}
            </nav>
          </div>
        </aside>
        
        <main className="p-6">
          <div className="mx-auto max-w-[760px]">
            <article className="prose prose-zinc dark:prose-invert max-w-none">{children}</article>
          </div>
        </main>

        {/* Правая колонка - Навигация по странице (как в документации) */}
        <aside className="toc-column hidden xl:block border-l border-black/5 dark:border-white/10 p-6 sticky top-[calc(var(--header-height)+1rem)] h-[calc(100vh-var(--header-height)-2rem)] overflow-y-auto">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            На этой странице
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Быстрая навигация по разделам
          </div>
          {/* Динамическое оглавление страницы */}
          <TableOfContents pageType="course" />
        </aside>
      </div>
    </div>
  );
}


