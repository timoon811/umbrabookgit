"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function AuthDebugger() {
  const { showSuccess, showError } = useToast();
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setAuthInfo(data);
        showSuccess('Аутентификация', 'Пользователь авторизован');
      } else {
        const errorData = await response.json();
        setAuthInfo({ error: errorData.error, status: response.status });
        showError('Аутентификация', 'Пользователь не авторизован');
      }
    } catch (error) {
      console.error('Ошибка проверки аутентификации:', error);
      setAuthInfo({ error: 'Ошибка сети', status: 0 });
      showError('Ошибка', 'Проблема с проверкой аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const testFileUpload = async () => {
    try {
      // Создаем тестовый файл
      const testData = new Blob(['Test file content'], { type: 'text/plain' });
      const testFile = new File([testData], 'test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('type', 'file');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Загрузка файла', `Файл загружен: ${data.file.url}`);
      } else {
        const errorData = await response.json();
        showError('Загрузка файла', `Ошибка: ${errorData.error} (${response.status})`);
      }
    } catch (error) {
      console.error('Ошибка тестовой загрузки:', error);
      showError('Загрузка файла', 'Ошибка сети при загрузке');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
          Диагностика аутентификации
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
              Статус аутентификации:
            </span>
            <button
              onClick={checkAuthStatus}
              className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            >
              Обновить
            </button>
          </div>

          {authInfo && (
            <div className="bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-lg p-4">
              <pre className="text-xs font-mono text-[#171717] dark:text-[#ededed] overflow-auto">
                {JSON.stringify(authInfo, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#171717]/10 dark:border-[#ededed]/10">
            <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
              Тест загрузки файла:
            </span>
            <button
              onClick={testFileUpload}
              className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            >
              Тестировать
            </button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Ожидаемые результаты:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Статус аутентификации должен показывать роль ADMIN</li>
                <li>Тест загрузки должен успешно загрузить файл</li>
                <li>При отсутствии прав должна быть ошибка 403</li>
                <li>При отсутствии токена должна быть ошибка 401</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
          Cookies диагностика
        </h3>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
              Auth Token:
            </span>
            <div className="mt-1 text-xs font-mono bg-[#171717]/5 dark:bg-[#ededed]/5 rounded p-2 break-all">
              {typeof window !== 'undefined' ? 
                (document.cookie.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1] || 'Не найден') : 
                'SSR'
              }
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
              Все cookies:
            </span>
            <div className="mt-1 text-xs font-mono bg-[#171717]/5 dark:bg-[#ededed]/5 rounded p-2 break-all">
              {typeof window !== 'undefined' ? 
                (document.cookie || 'Нет cookies') : 
                'SSR'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
