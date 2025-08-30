'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  depth?: number;
}

interface NavSection {
  title: string;
  sectionKey: string;
  items: NavItem[];
}

interface CoursesNavigationProps {
  nav: NavSection[];
}

export default function CoursesNavigation({ nav }: CoursesNavigationProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Определяем текущую страницу и раздел
  const getCurrentPageInfo = () => {
    if (!isClient) return { currentSection: null, currentPage: null };
    
    // Ищем текущую страницу в навигации
    for (const section of nav) {
      const currentPage = section.items.find(item => {
        // Проверяем точное совпадение
        if (item.href === pathname) return true;
        
        // Проверяем совпадение по slug (для страниц курсов)
        if (pathname.startsWith('/courses/') && item.href.startsWith('/courses/')) {
          const pathSlug = pathname.split('/courses/')[1];
          const itemSlug = item.href.split('/courses/')[1];
          return pathSlug === itemSlug;
        }
        
        return false;
      });
      
      if (currentPage) {
        return { currentSection: section.sectionKey, currentPage: currentPage.href };
      }
    }
    
    return { currentSection: null, currentPage: null };
  };

  const { currentSection, currentPage } = getCurrentPageInfo();

  if (!isClient) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <nav className="space-y-2">
      {nav.length > 0 ? (
        nav.map((section, index) => (
          <div key={`section-${section.sectionKey}-${index}`} className="space-y-1">
            {/* Заголовок раздела */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 text-sm font-semibold transition-colors rounded-md px-2 py-1.5 w-full ${
                  currentSection === section.sectionKey
                    ? 'text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                <span className="text-sm font-medium docs-nav-section-title flex-1 min-w-0">
                  {section.title}
                </span>
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex-shrink-0">
                  {section.items.length}
                </span>
              </div>
            </div>
            
            {/* Курсы в разделе */}
            {section.items.length > 0 && (
              <ul className="ml-3 space-y-0.5">
                {section.items.map((item, itemIndex) => {
                  const isCurrentPage = currentPage === item.href;
                  
                  return (
                    <li key={`item-${itemIndex}`}>
                      <Link
                        href={item.href}
                        className={`block text-sm py-1 px-2 rounded-md transition-colors w-full docs-nav-item ${
                          isCurrentPage
                            ? 'text-white bg-gray-900 dark:bg-gray-700 font-medium shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-6">
          <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Нет доступных курсов
          </p>
        </div>
      )}
    </nav>
  );
}
