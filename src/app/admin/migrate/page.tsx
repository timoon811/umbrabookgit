'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);

  const checkMigrationStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/full-migrate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setCheckResult(data);
    } catch (error) {
      console.error('Ошибка проверки:', error);
      setCheckResult({ error: 'Ошибка проверки статуса миграций' });
    } finally {
      setLoading(false);
    }
  };

  const applyMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/full-migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: 'migrate_2025_full',
          action: 'apply_all_migrations'
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
      // Обновляем статус после применения
      if (data.success) {
        await checkMigrationStatus();
      }
    } catch (error) {
      console.error('Ошибка применения миграции:', error);
      setResult({ error: 'Ошибка применения миграции' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Простой заголовок без зависимостей */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-8">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔧 Миграция базы данных
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Применение отсутствующих колонок в PostgreSQL
          </p>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔍 Полный аудит базы данных
            </h2>
            
            <button
              onClick={checkMigrationStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {loading ? 'Проверка...' : 'Проверить статус'}
            </button>

            {checkResult && (
              <div className="mt-4">
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(checkResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🚀 Применение полной миграции схемы базы данных
            </h2>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>Внимание:</strong> Эта операция применит все отсутствующие миграции:
              </p>
              <ul className="list-disc list-inside mt-2 text-yellow-700 dark:text-yellow-300">
                <li>Добавит отсутствующие колонки в processor_deposits</li>
                <li>Создаст недостающие таблицы (user_goals, goal_types, и др.)</li>
                <li>Установит правильные индексы и внешние ключи</li>
                <li>Применит все ожидающие миграции схемы</li>
              </ul>
            </div>

            <button
              onClick={applyMigration}
              disabled={loading || (checkResult && !checkResult.needsMigration)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Применение...' : 'Применить миграцию'}
            </button>

            {checkResult && !checkResult.needsMigration && (
              <p className="text-green-600 dark:text-green-400 mt-2">
                ✅ Все необходимые колонки уже существуют
              </p>
            )}

            {result && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Результат применения:
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
