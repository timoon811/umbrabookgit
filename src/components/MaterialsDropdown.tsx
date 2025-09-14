"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ContentProject {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  documentationSections?: {
    id: string;
    pages: {
      slug: string;
      title: string;
    }[];
  }[];
}

export default function MaterialsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Загрузка проектов при открытии меню
  useEffect(() => {
    if (isOpen && projects.length === 0) {
      loadProjects();
    }
  }, [isOpen]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content-projects');
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else if (response.status === 401 || response.status === 403) {
        // Пользователь не авторизован или не имеет прав
        setProjects([]);
      } else {
        console.error('Ошибка загрузки проектов:', response.status);
        setProjects([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'documentation':
        return 'Документация';
      case 'courses':
        return 'Курсы';
      case 'materials':
        return 'Материалы';
      default:
        return 'Контент';
    }
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'documentation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-3 3z" />
          </svg>
        );
      case 'courses':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'materials':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-3 3z" />
          </svg>
        );
    }
  };

  const getProjectHref = (project: ContentProject) => {
    // Пытаемся найти первую страницу проекта
    const firstSection = project.documentationSections?.[0];
    const firstPage = firstSection?.pages?.[0];
    
    if (firstPage?.slug) {
      switch (project.type) {
        case 'documentation':
        case 'materials':
          return `/docs/${firstPage.slug}`;
        case 'courses':
          return `/courses/${firstPage.slug}`;
        default:
          return `/docs/${firstPage.slug}`;
      }
    }
    
    // Fallback для проектов без страниц
    switch (project.type) {
      case 'documentation':
      case 'materials':
        return '/docs';
      case 'courses':
        return '/courses';
      default:
        return '/docs';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Кнопка "Материалы" */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#0a0a0a] hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
      >
        Материалы
        <svg 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Выпадающее меню - улучшенная версия без скролла и описаний */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Загрузка...
              </div>
            ) : projects.length > 0 ? (
              <>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  Проекты
                </div>
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={getProjectHref(project)}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 w-4 h-4">
                      {getProjectIcon(project.type)}
                    </div>
                    <div className="font-medium truncate">{project.name}</div>
                  </Link>
                ))}
              </>
            ) : (
              <div className="px-3 py-4 text-center">
                <div className="w-6 h-6 mx-auto mb-1.5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Проекты не найдены
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
