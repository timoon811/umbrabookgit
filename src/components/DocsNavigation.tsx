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

interface DocsNavigationProps {
  nav: NavSection[];
}

export default function DocsNavigation({ nav }: DocsNavigationProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log('📄 DocsNavigation: Получена навигация:', nav);
  }, [nav]);

  // Определяем текущую страницу и раздел
  const getCurrentPageInfo = () => {
    if (!isClient) return { currentSection: null, currentPage: null };
    
    // Ищем текущую страницу в навигации
    for (const section of nav) {
      const currentPage = section.items.find(item => {
        // Проверяем точное совпадение
        if (item.href === pathname) return true;
        
        // Проверяем совпадение по slug (для страниц документации)
        if (pathname.startsWith('/docs/') && item.href.startsWith('/docs/')) {
          const pathSlug = pathname.split('/docs/')[1];
          const itemSlug = item.href.split('/docs/')[1];
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
            
            {/* Страницы в разделе */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Нет доступных разделов
          </p>
        </div>
      )}
    </nav>
  );
}
