"use client";

import { useState, useEffect } from "react";

interface BuyerOverviewStats {
  totalBuyers: number;
  activeBuyers: number;
  totalProjects: number;
  activeProjects: number;
  totalSpend: number;
  totalRevenue: number;
  totalProfit: number;
  averageROAS: number;
  pendingRequests: number;
  activeSingals: number;
  monthlyStats: {
    totalBonuses: number;
    totalPayouts: number;
    sharedCosts: number;
  };
}

interface BuyerInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  projectCount: number;
  monthlyProfit: number;
  monthlyBonus: number;
  lastActivity: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export default function AdminBuyerOverviewPage() {
  const [stats, setStats] = useState<BuyerOverviewStats | null>(null);
  const [buyers, setBuyers] = useState<BuyerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Имитация данных для демонстрации
      const mockStats: BuyerOverviewStats = {
        totalBuyers: 12,
        activeBuyers: 9,
        totalProjects: 34,
        activeProjects: 28,
        totalSpend: 145000,
        totalRevenue: 267000,
        totalProfit: 122000,
        averageROAS: 1.84,
        pendingRequests: 7,
        activeSingals: 3,
        monthlyStats: {
          totalBonuses: 61000,
          totalPayouts: 58500,
          sharedCosts: 12300
        }
      };

      const mockBuyers: BuyerInfo[] = [
        {
          id: "1",
          name: "Иван Петров",
          email: "ivan@example.com",
          role: "BUYER",
          projectCount: 3,
          monthlyProfit: 25000,
          monthlyBonus: 12500,
          lastActivity: new Date(),
          status: "ACTIVE"
        },
        {
          id: "2",
          name: "Мария Сидорова",
          email: "maria@example.com",
          role: "LEAD_BUYER",
          projectCount: 5,
          monthlyProfit: 38000,
          monthlyBonus: 19000,
          lastActivity: new Date(),
          status: "ACTIVE"
        },
        {
          id: "3",
          name: "Алексей Козлов",
          email: "alex@example.com",
          role: "BUYER",
          projectCount: 2,
          monthlyProfit: 15000,
          monthlyBonus: 7500,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: "INACTIVE"
        }
      ];

      setStats(mockStats);
      setBuyers(mockBuyers);
    } catch (error) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'INACTIVE':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'BLOCKED':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Активен';
      case 'INACTIVE': return 'Неактивен';
      case 'BLOCKED': return 'Заблокирован';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Buyer Система - Обзор
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Управление байерами, проектами и финансовыми показателями
        </p>
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Всего байеров
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBuyers}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {stats.activeBuyers} активных
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Проекты
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalProjects}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {stats.activeProjects} активных
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Общий Spend
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalSpend)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  За текущий месяц
                </div>
              </div>
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Общий Revenue
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  ROAS: {stats.averageROAS.toFixed(2)}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Общая прибыль
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalProfit)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  За текущий месяц
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Заявки в ожидании
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingRequests}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  Требуют внимания
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Активные сигналы
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeSingals}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  Проблемы
                </div>
              </div>
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Месячные бонусы
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.monthlyStats.totalBonuses)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Выплачено: {formatCurrency(stats.monthlyStats.totalPayouts)}
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Buyers */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Топ байеры
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Лучшие показатели за текущий месяц
          </p>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {buyers.map((buyer) => (
            <div key={buyer.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {buyer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {buyer.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {buyer.email} • {buyer.role === 'LEAD_BUYER' ? 'Лид Байер' : 'Байер'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Проекты</div>
                    <div className="font-medium text-gray-900 dark:text-white">{buyer.projectCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Прибыль</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(buyer.monthlyProfit)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Бонус</div>
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(buyer.monthlyBonus)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(buyer.status)}`}>
                    {getStatusLabel(buyer.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

