"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FinanceStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accountsCount: number;
  transactionsCount: number;
  byCurrency: Record<string, number>;
  byType: Record<string, number>;
}

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinanceStats();
  }, []);

  const fetchFinanceStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalBalance: data.finance.totalBalance,
          monthlyIncome: data.finance.monthlyIncome,
          monthlyExpenses: data.finance.monthlyExpenses,
          accountsCount: data.overview.totalAccounts,
          transactionsCount: data.overview.totalTransactions,
          byCurrency: data.finance.byCurrency,
          byType: data.finance.byType,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка загрузки статистики');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Ошибка загрузки</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="text-center text-gray-500">Нет данных для отображения</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Финансовый дашборд
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Обзор финансового состояния системы
          </p>
        </div>
        <div className="text-sm text-[#171717]/40 dark:text-[#ededed]/40">
          Обновлено: {typeof window !== 'undefined' ? new Date().toLocaleString('ru-RU') : 'Загрузка...'}
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Общий баланс */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Общий баланс</p>
              <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
                {formatCurrency(stats.totalBalance)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Доход за месяц */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Доход за месяц</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.monthlyIncome)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Расход за месяц */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Расход за месяц</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(stats.monthlyExpenses)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Количество счетов */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Финансовые счета</p>
              <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
                {stats.accountsCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Баланс по валютам */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">Баланс по валютам</h3>
          <div className="space-y-3">
            {Object.entries(stats.byCurrency).map(([currency, balance]) => (
              <div key={currency} className="flex items-center justify-between p-3 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#171717]/10 dark:bg-[#ededed]/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">{currency}</span>
                  </div>
                  <span className="font-medium text-[#171717] dark:text-[#ededed]">{currency}</span>
                </div>
                <span className="font-bold text-[#171717] dark:text-[#ededed]">
                  {formatCurrency(balance, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Статистика транзакций */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">Статистика транзакций</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-lg">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Всего транзакций</span>
              <span className="font-bold text-[#171717] dark:text-[#ededed]">{stats.transactionsCount}</span>
            </div>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-lg">
                <span className="text-[#171717]/60 dark:text-[#ededed]/60">
                  {type === 'INCOME' ? 'Доходы' : type === 'EXPENSE' ? 'Расходы' : type === 'TRANSFER' ? 'Переводы' : type}
                </span>
                <span className="font-bold text-[#171717] dark:text-[#ededed]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/finance/accounts" 
            className="flex items-center p-4 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
          >
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-[#171717] dark:text-[#ededed]">Управление счетами</div>
              <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Создание и редактирование</div>
            </div>
          </Link>

          <Link 
            href="/admin/finance/transactions" 
            className="flex items-center p-4 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-[#171717] dark:text-[#ededed]">Транзакции</div>
              <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">История операций</div>
            </div>
          </Link>

          <Link 
            href="/admin/finance/reports" 
            className="flex items-center p-4 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-[#171717] dark:text-[#ededed]">Отчеты</div>
              <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Финансовая аналитика</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}


