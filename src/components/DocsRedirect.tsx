'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DebugInfo from './DebugInfo';

interface DocsRedirectProps {
  fallbackSlug?: string;
}

export default function DocsRedirect({ fallbackSlug }: DocsRedirectProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    async function redirectToFirstDoc() {
      try {
        console.log('🔄 DocsRedirect: Поиск первой страницы документации...');
        
        // Сначала попробуем fallback, если он есть
        if (fallbackSlug) {
          console.log(`🔄 DocsRedirect: Немедленный редирект на fallback /docs/${fallbackSlug}`);
          router.replace(`/docs/${fallbackSlug}`);
          return;
        }

        // Получаем список документации через API
        const response = await fetch('/api/documentation');
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('📄 DocsRedirect: Получены данные:', data);
        setDebugData({ response: data, fallbackSlug });

        // Проверяем различные форматы данных
        if (data.documentation && Array.isArray(data.documentation) && data.documentation.length > 0) {
          const firstDoc = data.documentation[0];
          if (firstDoc && firstDoc.slug) {
            console.log(`🔄 DocsRedirect: Клиентский редирект на /docs/${firstDoc.slug}`);
            router.replace(`/docs/${firstDoc.slug}`);
            return;
          }
        }

        // Если данных нет, пробуем редирект на известную страницу
        if (fallbackSlug) {
          console.log(`🔄 DocsRedirect: Редирект на fallback /docs/${fallbackSlug}`);
          router.replace(`/docs/${fallbackSlug}`);
        } else {
          console.log('⚠️ DocsRedirect: Документация не найдена');
          setError('Документация не найдена');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ DocsRedirect: Ошибка клиентского редиректа:', err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }

    // Добавляем небольшую задержку для надежности
    const timer = setTimeout(() => {
      redirectToFirstDoc();
    }, 100);

    return () => clearTimeout(timer);
  }, [router, fallbackSlug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Загрузка документации...
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Перенаправляем на первую страницу документации
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ошибка загрузки документации
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <>
      <DebugInfo 
        title="DocsRedirect Debug" 
        data={debugData}
        error={error}
      />
    </>
  );
}
