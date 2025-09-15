"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";

interface EarningsLog {
  id: string;
  type: string;
  description: string;
  amount: number;
  baseAmount?: number;
  percentage?: number;
  calculationDetails?: string;
  metadata?: string;
  createdAt: string;
  shift?: {
    id: string;
    shiftType: string;
    shiftDate: string;
  };
  deposit?: {
    id: string;
    amount: number;
    currency: string;
    playerId: string;
    playerEmail?: string;
  };
}

interface EarningsBreakdownData {
  breakdown: {
    [key: string]: {
      type: string;
      totalAmount: number;
      count: number;
      items: EarningsLog[];
    };
  };
  totalEarnings: number;
  totalEntries: number;
  typeStats: Array<{
    type: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }>;
}

interface EarningsBreakdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const EARNINGS_TYPE_NAMES: Record<string, string> = {
  BASE_SALARY: "Базовая зарплата",
  DEPOSIT_COMMISSION: "Комиссия от депозитов",
  SHIFT_BONUS: "Бонус за смену",
  MONTHLY_BONUS: "Месячный бонус",
  ACHIEVEMENT_BONUS: "Бонус за достижения",
  OVERTIME_BONUS: "Бонус за переработку",
  MANUAL_ADJUSTMENT: "Ручная корректировка",
};

const EARNINGS_TYPE_COLORS: Record<string, string> = {
  BASE_SALARY: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  DEPOSIT_COMMISSION: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  SHIFT_BONUS: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  MONTHLY_BONUS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  ACHIEVEMENT_BONUS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  OVERTIME_BONUS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  MANUAL_ADJUSTMENT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function EarningsBreakdown({ isOpen, onClose }: EarningsBreakdownProps) {
  const { showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EarningsBreakdownData | null>(null);
  const [logs, setLogs] = useState<EarningsLog[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all',
  });

  const loadEarningsBreakdown = async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type,
        page: '1',
        limit: '100',
      });

      const response = await fetch(`/api/manager/earnings-breakdown?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result.breakdown);
        setLogs(result.logs);
      } else {
        showError("Ошибка загрузки", result.error || "Не удалось загрузить детализацию заработков");
      }
    } catch (error) {
      console.error("Ошибка загрузки детализации заработков:", error);
      showError("Ошибка загрузки", "Произошла ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarningsBreakdown();
  }, [isOpen, filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Детализация заработков
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Подробная разбивка всех начислений и бонусов
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дата начала
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дата окончания
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Тип начислений
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Все типы</option>
                {Object.entries(EARNINGS_TYPE_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Сводка
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Детализация ({logs.length})
            </button>
          </nav>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span>
            </div>
          ) : activeTab === 'summary' ? (
            <div className="space-y-6">
              {/* Общая статистика */}
              {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ${data.totalEarnings.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Общий заработок</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {data.totalEntries}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Всего начислений</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {data.typeStats.length}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Типов начислений</div>
                  </div>
                </div>
              )}

              {/* Разбивка по типам */}
              {data?.typeStats && data.typeStats.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Разбивка по типам начислений
                  </h4>
                  <div className="space-y-3">
                    {data.typeStats.map((stat) => (
                      <div
                        key={stat.type}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              EARNINGS_TYPE_COLORS[stat.type] || EARNINGS_TYPE_COLORS.MANUAL_ADJUSTMENT
                            }`}>
                              {EARNINGS_TYPE_NAMES[stat.type] || stat.type}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {stat.count} начислений
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              ${stat.totalAmount.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {stat.percentage.toFixed(1)}% от общего
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${stat.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    Нет данных о начислениях за выбранный период
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {logs.length > 0 ? (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            EARNINGS_TYPE_COLORS[log.type] || EARNINGS_TYPE_COLORS.MANUAL_ADJUSTMENT
                          }`}>
                            {EARNINGS_TYPE_NAMES[log.type] || log.type}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${log.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {log.description}
                      </div>
                      {log.calculationDetails && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Расчет: {log.calculationDetails}
                        </div>
                      )}
                      {(log.shift || log.deposit) && (
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {log.shift && (
                            <span>
                              Смена: {log.shift.shiftType} ({new Date(log.shift.shiftDate).toLocaleDateString('ru-RU')})
                            </span>
                          )}
                          {log.deposit && (
                            <span>
                              Депозит: ${log.deposit.amount} от {log.deposit.playerId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    Нет записей о начислениях за выбранный период
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
