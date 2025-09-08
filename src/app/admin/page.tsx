"use client";

import { useState, useEffect } from "react";

interface StatsData {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalAccounts: number;
    totalTransactions: number;
  };
  users: {
    active: number;
    pending: number;
    blocked: number;
    rejected: number;
    byRole: Record<string, number>;
  };
  courses: {
    published: number;
    draft: number;
    newThisWeek: number;
  };
  finance: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    newTransactionsThisWeek: number;
    byType: Record<string, number>;
    byCurrency: Record<string, number>;
  };
  weekly: {
    newUsers: number;
    newCourses: number;
    newTransactions: number;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
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

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'ADMIN': 'Администратор',
      'MODERATOR': 'Модератор',
      'MEDIA_BUYER': 'Медиа байер',
      'PROCESSOR': 'Обработчик',
      'SUPPORT': 'Поддержка',
      'USER': 'Пользователь',
    };
    return labels[role] || role;
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
            Дашборд администратора
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Обзор системы и ключевые метрики
          </p>
        </div>
        <div className="text-sm text-[#171717]/40 dark:text-[#ededed]/40">
          Обновлено: {typeof window !== 'undefined' ? new Date().toLocaleString('ru-RU') : 'Загрузка...'}
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Пользователи */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Всего пользователей</p>
              <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">{stats.overview?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-[#0a0a0a]/50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 dark:text-green-400">+{stats.weekly?.newUsers || 0}</span>
            <span className="text-[#171717]/60 dark:text-[#ededed]/60 ml-2">за неделю</span>
          </div>
        </div>

        {/* Курсы */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Всего курсов</p>
              <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">{stats.overview?.totalCourses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 dark:text-green-400">+{stats.weekly?.newCourses || 0}</span>
            <span className="text-[#171717]/60 dark:text-[#ededed]/60 ml-2">за неделю</span>
          </div>
        </div>

        {/* Финансы */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Общий баланс</p>
              <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
                {formatCurrency(stats.finance?.totalBalance || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 dark:text-green-400">+{stats.weekly?.newTransactions || 0}</span>
            <span className="text-[#171717]/60 dark:text-[#ededed]/60 ml-2">транзакций</span>
          </div>
        </div>

        {/* Активные пользователи */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Активные пользователи</p>
              <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">{stats.users?.active || 0}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-600 dark:text-yellow-400">{stats.users?.pending || 0}</span>
            <span className="text-[#171717]/60 dark:text-[#ededed]/60 ml-2">ожидают</span>
          </div>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Статистика пользователей */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">Статистика пользователей</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Активные</span>
              <span className="font-medium text-green-600 dark:text-green-400">{stats.users?.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Ожидают подтверждения</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">{stats.users?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Заблокированы</span>
              <span className="font-medium text-red-600 dark:text-red-400">{stats.users?.blocked || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Отклонены</span>
              <span className="font-medium text-red-600 dark:text-red-400">{stats.users?.rejected || 0}</span>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-3">По ролям</h4>
            <div className="space-y-2">
              {stats.users.byRole && Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between text-sm">
                  <span className="text-[#171717]/60 dark:text-[#ededed]/60">{getRoleLabel(role)}</span>
                  <span className="font-medium">{count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Финансовая статистика */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">Финансовая статистика</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Доход за месяц</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(stats.finance?.monthlyIncome || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Расход за месяц</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(stats.finance?.monthlyExpenses || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#171717]/60 dark:text-[#ededed]/60">Транзакций за неделю</span>
              <span className="font-medium">{stats.finance?.newTransactionsThisWeek || 0}</span>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-3">По валютам</h4>
            <div className="space-y-2">
              {stats.finance.byCurrency && Object.entries(stats.finance.byCurrency).map(([currency, balance]) => (
                <div key={currency} className="flex items-center justify-between text-sm">
                  <span className="text-[#171717]/60 dark:text-[#ededed]/60">{currency}</span>
                  <span className="font-medium">{formatCurrency(balance || 0, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
