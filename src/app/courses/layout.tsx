import { getCoursesNav } from "@/lib/courses";
import CoursesNavigation from "@/components/CoursesNavigation";
import TableOfContents from "@/components/TableOfContents";

interface CoursesLayoutProps {
  children: React.ReactNode;
}

export default async function CoursesLayout({ children }: CoursesLayoutProps) {
  // Получаем навигацию для курсов
  const nav = await getCoursesNav('courses');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="docs-layout">
        {/* Левый сайдбар - навигация */}
        <aside className="docs-sidebar border-r border-gray-200 dark:border-gray-800">
          <div className="sticky top-[calc(var(--header-height)+0.5rem)] h-[calc(100vh-var(--header-height)-1rem)] overflow-y-auto p-3">
            {/* Навигация */}
            <CoursesNavigation nav={nav} />
          </div>
        </aside>

        {/* Центральный контент */}
        <main className="docs-content">
          {children}
        </main>

        {/* Правая колонка - TOC */}
        <aside className="docs-toc border-l border-gray-200 dark:border-gray-800">
          <div className="sticky top-[calc(var(--header-height)+0.5rem)] h-[calc(100vh-var(--header-height)-1rem)] overflow-y-auto p-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              На этой странице
            </div>
            <TableOfContents content="dynamic" />
          </div>
        </aside>
      </div>
    </div>
  );
}


