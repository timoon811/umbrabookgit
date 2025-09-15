"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BuyerStats, BuyerSignal, BuyerRequest } from "@/types/buyer";
import BuyerStatsCards from "./BuyerStatsCards";
import BuyerProjectsList from "./BuyerProjectsList";
import BuyerRequestsList from "./BuyerRequestsList";
import BuyerSignalsList from "./BuyerSignalsList";
import BuyerSidebar from "./BuyerSidebar";
import BuyerDailyLogs from "./BuyerDailyLogs";
import BuyerBonusSystem from "./BuyerBonusSystem";
import BuyerSignalsSystem from "./BuyerSignalsSystem";
import BuyerSharedCosts from "./BuyerSharedCosts";
import BuyerReportsSystem from "./BuyerReportsSystem";

interface TabInfo {
  id: string;
  name: string;
  icon: string;
  badge?: number;
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs: TabInfo[] = [
    { 
      id: "dashboard", 
      name: "Dashboard", 
      icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
    },
    { 
      id: "projects", 
      name: "Проекты", 
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
    },
    { 
      id: "dailylogs", 
      name: "Дневники", 
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
    },
    { 
      id: "requests", 
      name: "Заявки", 
      icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      badge: stats?.recentRequests?.filter(r => r.status === 'SUBMITTED').length || 0
    },
    { 
      id: "bonus", 
      name: "Бонусы", 
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" 
    },
    { 
      id: "signals", 
      name: "Сигналы", 
      icon: "M15 17h5l-5 5-5-5h5v-6h4v6zm-4-8V3h4v6h-4z",
      badge: stats?.activeSignals?.filter(s => s.severity === 'CRITICAL' || s.severity === 'HIGH').length || 0
    },
    { 
      id: "shared-costs", 
      name: "Общие расходы", 
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    },
    { 
      id: "reports", 
      name: "Отчеты", 
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/buyer/stats');
      
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Ошибка загрузки
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Buyer Panel
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Добро пожаловать, {user?.name}
              </p>
            </div>
            
            {/* Quick Stats in Header */}
            {stats && (
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Текущий период</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(stats.currentPeriod.profit)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">ROAS</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.currentPeriod.roas.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Прогноз бонуса</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.bonusPreview.estimatedBonus)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <BuyerSidebar 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              tabs={tabs}
              stats={stats}
            />
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                {stats && <BuyerStatsCards stats={stats} />}

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Быстрые действия
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setActiveTab("projects")}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Создать проект</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Новый рекламный проект</div>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveTab("dailylogs")}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Заполнить дневник</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Данные за вчера</div>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveTab("requests")}
                      className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Создать заявку</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Бюджет или расходники</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Alerts */}
                {stats && stats.alerts.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Важные сигналы
                    </h3>
                    <BuyerSignalsList signals={stats.alerts} compact={true} />
                  </div>
                )}

                {/* Recent Requests */}
                {stats && stats.recentRequests.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Последние заявки
                    </h3>
                    <BuyerRequestsList requests={stats.recentRequests} compact={true} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <BuyerProjectsList />
            )}

            {activeTab === "dailylogs" && (
              <BuyerDailyLogs />
            )}

            {activeTab === "requests" && (
              <BuyerRequestsList />
            )}

            {activeTab === "bonus" && (
              <BuyerBonusSystem />
            )}

            {activeTab === "signals" && (
              <BuyerSignalsSystem />
            )}

            {activeTab === "shared-costs" && (
              <BuyerSharedCosts />
            )}

            {activeTab === "reports" && (
              <BuyerReportsSystem />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
