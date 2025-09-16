'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/AdminHeader';

export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);

  const checkMigrationStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/migrate', {
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
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply_platform_commission_columns'
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
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Применение миграций базы данных
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Проверка статуса миграций
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
              Применение миграции для колонок Platform Commission
            </h2>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>Внимание:</strong> Эта операция добавит отсутствующие колонки в таблицу processor_deposits:
              </p>
              <ul className="list-disc list-inside mt-2 text-yellow-700 dark:text-yellow-300">
                <li>platformCommissionPercent</li>
                <li>platformCommissionAmount</li>
                <li>processorEarnings</li>
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
