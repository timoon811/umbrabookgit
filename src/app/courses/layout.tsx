import React from 'react';
import { getCoursesNav } from "@/lib/courses";
import CoursesNavigation from "@/components/CoursesNavigation";
import TableOfContents from "@/components/TableOfContents";
import SmartSidebar from "@/components/SmartSidebar";
import BodyClassManager from "@/components/BodyClassManager";
import AuthGuard from "@/components/AuthGuard";

interface CoursesLayoutProps {
  children: React.ReactNode;
}

export default async function CoursesLayout({ children }: CoursesLayoutProps) {
  // Получаем навигацию для курсов
  const nav = await getCoursesNav('courses');

  return (
    <AuthGuard blockProcessors={true}>
      <BodyClassManager className="page-with-custom-layout" />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="docs-layout">
        {/* Левый сайдбар - навигация */}
        <aside className="docs-sidebar border-r border-gray-200 dark:border-gray-800">
          <SmartSidebar>
            <CoursesNavigation nav={nav} />
          </SmartSidebar>
        </aside>

        {/* Центральный контент */}
        <main className="docs-content">
          {children}
        </main>

        {/* Правая колонка - TOC */}
        <aside className="docs-toc border-l border-gray-200 dark:border-gray-800">
          <SmartSidebar>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              На этой странице
            </div>
            <TableOfContents content="dynamic" />
          </SmartSidebar>
        </aside>
        </div>
      </div>
    </AuthGuard>
  );
}


