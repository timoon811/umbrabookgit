"use client";

import { useState, useEffect } from 'react';

interface SalaryStats {
  todayHours: number;
  monthHours: number;
  todayBaseSalary: number;
  monthBaseSalary: number;
  projectedMonthSalary: number;
  hourlyRate: number;
  currentActiveHours?: number;
  platformCommissionPercent: number;
}

interface SalaryStatsCardProps {
  stats: SalaryStats;
  isShiftActive: boolean;
  className?: string;
}

export default function SalaryStatsCard({ stats, isShiftActive, className = "" }: SalaryStatsCardProps) {
  const [currentActiveHours, setCurrentActiveHours] = useState(0);

  useEffect(() => {
    if (!isShiftActive) {
      setCurrentActiveHours(0);
      return;
    }

    // Обновляем счетчик активных часов каждую минуту
    const interval = setInterval(() => {
      setCurrentActiveHours(prev => prev + (1 / 60)); // добавляем 1 минуту в часах
    }, 60000);

    return () => clearInterval(interval);
  }, [isShiftActive]);

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}ч ${m}м`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Статистика зарплаты
        </h3>
      </div>

      <div className="space-y-6">
        {/* Рабочие часы */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Рабочие часы
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Сегодня
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatHours(stats.todayHours + (isShiftActive ? currentActiveHours : 0))}
              </div>
              {isShiftActive && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  + {formatHours(currentActiveHours)} активно
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                За месяц
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatHours(stats.monthHours)}
              </div>
            </div>
          </div>
        </div>

        {/* Заработок по базовой ставке */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Оклад (базовая ставка: {formatCurrency(stats.hourlyRate)}/час)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                Заработано сегодня
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-300">
                {formatCurrency(stats.todayBaseSalary + (isShiftActive ? currentActiveHours * stats.hourlyRate : 0))}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                Заработано за месяц
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-300">
                {formatCurrency(stats.monthBaseSalary)}
              </div>
            </div>
          </div>
        </div>

        {/* Прогноз */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
          <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
            Прогноз оклада на месяц
          </div>
          <div className="text-xl font-bold text-purple-900 dark:text-purple-300">
            {formatCurrency(stats.projectedMonthSalary)}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            На основе текущего темпа работы
          </div>
        </div>


        {/* Информация */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Примечание:</strong> Оклад рассчитывается только за отработанные часы. 
            Дополнительно вы получаете проценты от депозитов согласно бонусной сетке.
          </div>
        </div>
      </div>
    </div>
  );
}
