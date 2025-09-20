'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DocsNavigation from "@/components/DocsNavigation";
import TableOfContents from "@/components/TableOfContents";
import SmartSidebar from "@/components/SmartSidebar";

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

interface DocsContentProps {
  children: React.ReactNode;
}

export default function DocsContent({ children }: DocsContentProps) {
  const searchParams = useSearchParams();
  const [nav, setNav] = useState<NavSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Получаем ID проекта из URL параметров
  const projectId = searchParams.get('project');

  useEffect(() => {
    loadNavigation();
  }, [projectId]);

  const loadNavigation = async () => {
    try {
      setLoading(true);
      console.log('🔄 DocsContent: Загружаем навигацию для проекта:', projectId);
      
      // ИСПРАВЛЕНИЕ: Если projectId не указан, пытаемся получить первый доступный проект
      if (!projectId) {
        console.log('⚠️ DocsContent: ProjectId не указан, ищем первый доступный проект');
        try {
          const projectsResponse = await fetch('/api/content-projects', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (projectsResponse.ok) {
            const projects = await projectsResponse.json();
            if (projects.length > 0) {
              const firstProject = projects[0];
              console.log('🔄 DocsContent: Найден первый проект:', firstProject.name, firstProject.id);
              
              // Устанавливаем флаг для перенаправления
              setShouldRedirect(true);
              
              // Для демонстрации показываем пустую навигацию
              setNav([]);
              setLoading(false);
              
              // Перенаправляем пользователя на первый проект
              if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const newUrl = `${currentPath}?project=${firstProject.id}`;
                window.location.href = newUrl;
              }
              return;
            }
          }
        } catch (projectError) {
          console.error('❌ DocsContent: Ошибка получения проектов:', projectError);
        }
        
        console.log('❌ DocsContent: Нет доступных проектов, показываем пустую навигацию');
        setNav([]);
        setLoading(false);
        return;
      }
      
      // Строим URL для API запроса с обязательным projectId
      const apiUrl = `/api/docs/navigation?projectId=${projectId}`;
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNav(data);
        console.log('✅ DocsContent: Навигация загружена, разделов:', data.length);
      } else {
        console.error('❌ DocsContent: Ошибка загрузки навигации:', response.status);
        setNav([]);
      }
    } catch (error) {
      console.error('❌ DocsContent: Ошибка при загрузке навигации:', error);
      setNav([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Убираем дублирующийся хэдер - используем основной из ConditionalNavigation */}

      <div className="docs-layout">
        {/* Левый сайдбар - навигация (улучшенное позиционирование) */}
        <aside className="docs-sidebar border-r border-gray-200 dark:border-gray-800">
          <SmartSidebar>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse ml-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse ml-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse ml-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse"></div>
              </div>
            ) : shouldRedirect ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Перенаправляем на первый доступный проект...
                </p>
              </div>
            ) : nav.length === 0 && !projectId ? (
              <div className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 dark:bg-[#0a0a0a] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Выберите проект в меню "Материалы"
                </p>
              </div>
            ) : (
              <DocsNavigation nav={nav} />
            )}
          </SmartSidebar>
        </aside>

        {/* Центральный контент */}
        <main className="docs-content">
          {children}
        </main>

        {/* Правая колонка - TOC (улучшенное позиционирование) */}
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
  );
}
