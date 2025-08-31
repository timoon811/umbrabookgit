"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { RefreshCw, Plus, Trash, TestTube } from "lucide-react";

interface TestDeposit {
  id: string;
  amount: number;
  token: string;
  amountUsd: number;
  mammothLogin: string;
  source: string;
  project: string;
  createdAt: string;
}

interface TestStats {
  testDepositsCount: number;
  lastTestDeposits: TestDeposit[];
}

export default function DepositsTestPanel() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TestStats | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deposits/test');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const error = await response.json();
        showError('Ошибка', error.error || 'Не удалось загрузить статистику');
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      showError('Ошибка', 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const createTestDeposit = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deposits/test', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Тестовый депозит создан', 
          `${result.deposit.amount} ${result.deposit.token} (${result.deposit.amountUsd.toFixed(2)} USD)`);
        await loadStats(); // Обновляем статистику
      } else {
        const error = await response.json();
        showError('Ошибка создания', error.error || 'Не удалось создать тестовый депозит');
      }
    } catch (error) {
      console.error('Ошибка создания тестового депозита:', error);
      showError('Ошибка создания', 'Произошла ошибка при создании депозита');
    } finally {
      setLoading(false);
    }
  };

  const clearTestDeposits = async () => {
    if (!confirm('Вы уверены, что хотите удалить все тестовые депозиты?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/deposits/test', {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Тестовые депозиты удалены', result.message);
        await loadStats(); // Обновляем статистику
      } else {
        const error = await response.json();
        showError('Ошибка удаления', error.error || 'Не удалось удалить тестовые депозиты');
      }
    } catch (error) {
      console.error('Ошибка удаления тестовых депозитов:', error);
      showError('Ошибка удаления', 'Произошла ошибка при удалении депозитов');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
              Тестирование депозитов
            </h3>
            <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
              Создание и управление тестовыми депозитами
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          <button
            onClick={createTestDeposit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Создать тестовый
          </button>
          {stats && stats.testDepositsCount > 0 && (
            <button
              onClick={clearTestDeposits}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Trash className="w-4 h-4" />
              Очистить ({stats.testDepositsCount})
            </button>
          )}
        </div>
      </div>

      {loading && !stats && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Всего тестовых депозитов
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.testDepositsCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Последних депозитов
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.lastTestDeposits.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {stats.lastTestDeposits.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-[#171717] dark:text-[#ededed] mb-3">
                Последние тестовые депозиты
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[#171717]/10 dark:border-[#ededed]/10">
                      <th className="text-left py-2 px-3 font-medium text-[#171717]/70 dark:text-[#ededed]/70 text-sm">ID</th>
                      <th className="text-left py-2 px-3 font-medium text-[#171717]/70 dark:text-[#ededed]/70 text-sm">Мамонт</th>
                      <th className="text-left py-2 px-3 font-medium text-[#171717]/70 dark:text-[#ededed]/70 text-sm">Сумма</th>
                      <th className="text-left py-2 px-3 font-medium text-[#171717]/70 dark:text-[#ededed]/70 text-sm">USD</th>
                      <th className="text-left py-2 px-3 font-medium text-[#171717]/70 dark:text-[#ededed]/70 text-sm">Источник</th>
                      <th className="text-left py-2 px-3 font-medium text-[#171717]/70 dark:text-[#ededed]/70 text-sm">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lastTestDeposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b border-[#171717]/5 dark:border-[#ededed]/5 hover:bg-[#171717]/2 dark:hover:bg-[#ededed]/2">
                        <td className="py-2 px-3 text-sm font-mono text-[#171717] dark:text-[#ededed]">
                          #{deposit.id.slice(-8)}
                        </td>
                        <td className="py-2 px-3 text-sm text-[#171717] dark:text-[#ededed]">
                          {deposit.mammothLogin}
                        </td>
                        <td className="py-2 px-3 text-sm font-medium text-[#171717] dark:text-[#ededed]">
                          {deposit.amount} {deposit.token}
                        </td>
                        <td className="py-2 px-3 text-sm text-green-600 dark:text-green-400">
                          ${deposit.amountUsd.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-sm text-[#171717] dark:text-[#ededed]">
                          {deposit.source}
                        </td>
                        <td className="py-2 px-3 text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                          {new Date(deposit.createdAt).toLocaleString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !stats && (
        <div className="text-center py-8">
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mb-4">
            Нажмите "Обновить" для загрузки статистики
          </p>
          <button
            onClick={loadStats}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Загрузить статистику
          </button>
        </div>
      )}
    </div>
  );
}
