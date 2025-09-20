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
  
  // Получаем ID проекта из URL параметров
  const projectId = searchParams.get('project');

  useEffect(() => {
    loadNavigation();
  }, [projectId]);

  const loadNavigation = async () => {
    try {
      setLoading(true);
      console.log('🔄 DocsContent: Загружаем навигацию для проекта:', projectId);
      
      // Строим URL для API запроса
      const apiUrl = projectId 
        ? `/api/docs/navigation?projectId=${projectId}`
        : '/api/docs/navigation';
      
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
