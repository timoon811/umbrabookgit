"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Динамический импорт Swagger UI для избежания SSR проблем
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSwaggerSpec = async () => {
      try {
        const response = await fetch('/api/swagger');
        if (!response.ok) {
          throw new Error('Failed to load API specification');
        }
        const spec = await response.json();
        setSwaggerSpec(spec);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSwaggerSpec();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#171717] dark:border-[#ededed] mx-auto mb-4"></div>
          <p className="text-[#171717] dark:text-[#ededed]">Загрузка API документации...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-[#171717] dark:text-[#ededed] mb-2">
            Ошибка загрузки документации
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed] mb-4">
            API Документация
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Интерактивная документация для API платформы Umbra. 
            Здесь вы можете ознакомиться со всеми доступными endpoints, 
            их параметрами и схемами данных.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#171717]/10 dark:border-[#ededed]/10 overflow-hidden">
          {swaggerSpec && (
            <SwaggerUI
              spec={swaggerSpec}
              docExpansion="list"
              defaultModelsExpandDepth={1}
              defaultModelExpandDepth={1}
              displayOperationId={false}
              displayRequestDuration={true}
              tryItOutEnabled={true}
              filter={true}
              showExtensions={false}
              showCommonExtensions={false}
              deepLinking={true}
              supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
              onComplete={() => {
                // Настройка темы для Swagger UI
                const style = document.createElement('style');
                style.textContent = `
                  .swagger-ui {
                    font-family: inherit;
                  }
                  .swagger-ui .topbar {
                    display: none;
                  }
                  .swagger-ui .info {
                    margin: 20px 0;
                  }
                  .swagger-ui .scheme-container {
                    background: transparent;
                    box-shadow: none;
                  }
                `;
                document.head.appendChild(style);
              }}
            />
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Документация обновляется автоматически при изменении API.
            <br />
            Для получения доступа к API используйте аутентификацию через cookie.
          </p>
        </div>
      </div>
    </div>
  );
}
