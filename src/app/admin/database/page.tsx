'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface TableCheck {
  table: string;
  exists: boolean;
  rowCount: number;
  error?: string;
}

interface ColumnCheck {
  table: string;
  column: string;
  exists: boolean;
  type?: string;
  error?: string;
}

interface DatabaseCheckResult {
  isHealthy: boolean;
  tables: TableCheck[];
  columns: ColumnCheck[];
  missingTables: string[];
  missingColumns: Array<{ table: string; column: string }>;
  errors: string[];
}

export default function DatabaseMigrationPage() {
  const [checkResult, setCheckResult] = useState<DatabaseCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/admin/database/check');
      if (!response.ok) {
        throw new Error('Failed to check database');
      }
      const result = await response.json();
      setCheckResult(result);
    } catch (error) {
      toast.error('Ошибка при проверке базы данных');
      console.error('Database check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const runMigration = async (action: string, targetTable?: string, targetColumn?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/database/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, targetTable, targetColumn }),
      });

      if (!response.ok) {
        throw new Error('Migration failed');
      }

      const result = await response.json();
      toast.success('Миграция выполнена успешно');
      
      // Перепроверяем БД после миграции
      await checkDatabase();
    } catch (error) {
      toast.error('Ошибка при выполнении миграции');
      console.error('Migration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBuyerTables = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/database/create-buyer-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create buyer tables');
      }

      const result = await response.json();
      toast.success('Таблицы Buyer системы созданы успешно');
      
      // Перепроверяем БД после создания таблиц
      await checkDatabase();
    } catch (error) {
      toast.error('Ошибка при создании таблиц Buyer системы');
      console.error('Buyer tables creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProcessingTables = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/database/create-processing-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create processing tables');
      }

      const result = await response.json();
      toast.success('Таблицы Processing системы созданы успешно');
      
      // Перепроверяем БД после создания таблиц
      await checkDatabase();
    } catch (error) {
      toast.error('Ошибка при создании таблиц Processing системы');
      console.error('Processing tables creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (exists: boolean) => {
    return exists ? '✅' : '❌';
  };

  const getStatusColor = (exists: boolean) => {
    return exists ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Миграция и проверка базы данных
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Проверка состояния БД и восстановление недостающих элементов
        </p>
      </div>

      {/* Кнопки управления */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={checkDatabase}
          disabled={isChecking}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isChecking ? 'Проверяю...' : 'Перепроверить БД'}
        </button>

        <button
          onClick={() => runMigration('run_full_migration')}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Выполняю...' : 'Запустить полную миграцию'}
        </button>

        <button
          onClick={createBuyerTables}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Создаю...' : 'Создать таблицы Buyer системы'}
        </button>

        <button
          onClick={createProcessingTables}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Создаю...' : 'Создать таблицы Processing системы'}
        </button>
      </div>

      {checkResult && (
        <div className="space-y-6">
          {/* Общий статус */}
          <div className={`p-4 rounded-lg ${checkResult.isHealthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
            <h2 className="text-xl font-semibold mb-2">
              {getStatusIcon(checkResult.isHealthy)} Общий статус БД
            </h2>
            <p className={getStatusColor(checkResult.isHealthy)}>
              {checkResult.isHealthy ? 'База данных в порядке' : 'Обнаружены проблемы в базе данных'}
            </p>
            {checkResult.errors.length > 0 && (
              <div className="mt-3">
                <h3 className="font-medium text-red-600">Ошибки:</h3>
                <ul className="list-disc list-inside text-red-600 text-sm">
                  {checkResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Недостающие таблицы */}
          {checkResult.missingTables.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3 text-yellow-800">
                ❌ Недостающие таблицы ({checkResult.missingTables.length})
              </h2>
              <div className="space-y-2">
                {checkResult.missingTables.map((table) => (
                  <div key={table} className="flex items-center justify-between bg-white p-3 rounded border">
                    <span className="font-mono text-sm">{table}</span>
                    <button
                      onClick={() => runMigration('create_missing_table', table)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Создать таблицу
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Недостающие колонки */}
          {checkResult.missingColumns.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3 text-orange-800">
                ❌ Недостающие колонки ({checkResult.missingColumns.length})
              </h2>
              <div className="space-y-2">
                {checkResult.missingColumns.map(({ table, column }, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                    <span className="font-mono text-sm">{table}.{column}</span>
                    <button
                      onClick={() => runMigration('add_missing_column', table, column)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                    >
                      Добавить колонку
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Статус таблиц */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
            <div className="px-4 py-3 border-b">
              <h2 className="text-xl font-semibold">Статус таблиц</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkResult.tables.map((table) => (
                  <div
                    key={table.table}
                    className={`p-3 rounded border ${table.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">{table.table}</span>
                      <span>{getStatusIcon(table.exists)}</span>
                    </div>
                    {table.exists ? (
                      <p className="text-xs text-green-600 mt-1">{table.rowCount} записей</p>
                    ) : (
                      <p className="text-xs text-red-600 mt-1">{table.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Статус колонок */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
            <div className="px-4 py-3 border-b">
              <h2 className="text-xl font-semibold">Статус критических колонок</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {checkResult.columns.map((column, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${column.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        {column.table}.{column.column}
                      </span>
                      <span>{getStatusIcon(column.exists)}</span>
                    </div>
                    {column.exists ? (
                      <p className="text-xs text-green-600 mt-1">Тип: {column.type}</p>
                    ) : (
                      <p className="text-xs text-red-600 mt-1">{column.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!checkResult && !isChecking && (
        <div className="text-center py-12">
          <p className="text-gray-500">Загрузка...</p>
        </div>
      )}
    </div>
  );
}
