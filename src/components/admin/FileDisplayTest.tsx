"use client";

import React, { useState } from 'react';
import { normalizeFileUrl } from '@/lib/file-utils';

export default function FileDisplayTest() {
  const [testUrls] = useState([
    '/uploads/images/test-image.jpg',
    '/uploads/files/test-document.pdf',
    'uploads/images/test-image-without-slash.png',
    '/api/uploads/images/test-via-api.jpg',
  ]);

  const [imageLoadStatus, setImageLoadStatus] = useState<Record<string, 'loading' | 'success' | 'error'>>({});

  const handleImageLoad = (url: string) => {
    setImageLoadStatus(prev => ({ ...prev, [url]: 'success' }));
  };

  const handleImageError = (url: string) => {
    setImageLoadStatus(prev => ({ ...prev, [url]: 'error' }));
  };

  const testFileAccess = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return { status: response.status, ok: response.ok };
    } catch (error) {
      return { status: 0, ok: false, error: error.message };
    }
  };

  const [accessResults, setAccessResults] = useState<Record<string, any>>({});

  const checkAllAccess = async () => {
    const results: Record<string, any> = {};
    
    for (const url of testUrls) {
      const normalizedUrl = normalizeFileUrl(url);
      results[url] = await testFileAccess(normalizedUrl);
    }
    
    setAccessResults(results);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
            Тест отображения файлов
          </h3>
          <button
            onClick={checkAllAccess}
            className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            Проверить доступ
          </button>
        </div>
        
        <div className="space-y-4">
          {testUrls.map((url) => {
            const normalizedUrl = normalizeFileUrl(url);
            const status = imageLoadStatus[url] || 'loading';
            const accessResult = accessResults[url];
            
            return (
              <div key={url} className="border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
                      Исходный URL:
                    </div>
                    <div className="text-xs font-mono bg-[#171717]/5 dark:bg-[#ededed]/5 rounded p-2 break-all">
                      {url}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
                      Нормализованный URL:
                    </div>
                    <div className="text-xs font-mono bg-green-50 dark:bg-green-900/20 rounded p-2 break-all">
                      {normalizedUrl}
                    </div>
                  </div>
                  
                  {accessResult && (
                    <div>
                      <div className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
                        Результат проверки доступа:
                      </div>
                      <div className={`text-xs rounded p-2 ${
                        accessResult.ok 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                          : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}>
                        Status: {accessResult.status} | OK: {accessResult.ok ? 'Да' : 'Нет'}
                        {accessResult.error && ` | Error: ${accessResult.error}`}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                      Тест изображения:
                    </div>
                    <div className="flex items-center gap-4">
                      <img
                        src={normalizedUrl}
                        alt="Test"
                        className="w-16 h-16 object-cover rounded border border-[#171717]/10 dark:border-[#ededed]/10"
                        onLoad={() => handleImageLoad(url)}
                        onError={() => handleImageError(url)}
                      />
                      <div className={`text-xs px-2 py-1 rounded ${
                        status === 'success' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : status === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {status === 'success' ? '✅ Загружено' : status === 'error' ? '❌ Ошибка' : '⏳ Загрузка'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a
                      href={normalizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    >
                      Открыть в новой вкладке
                    </a>
                    
                    <button
                      onClick={async () => {
                        const result = await testFileAccess(normalizedUrl);
                        setAccessResults(prev => ({ ...prev, [url]: result }));
                      }}
                      className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    >
                      Проверить доступ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 dark:text-yellow-400">ℹ️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Ожидаемые результаты
            </h3>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <div>• Все URL должны быть нормализованы (начинаться с /)</div>
              <div>• Status 200 означает, что файл доступен</div>
              <div>• Изображения должны корректно загружаться и отображаться</div>
              <div>• Ссылки должны открываться в новой вкладке</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
