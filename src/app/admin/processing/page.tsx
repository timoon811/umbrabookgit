"use client";

import { useState, useEffect } from "react";

interface ProcessorStats {
  totalDeposits: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalBonuses: number;
  pendingSalaryRequests: number;
}

export default function AdminProcessingPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<ProcessorStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Заглушка для статистики
      setStats({
        totalDeposits: 0,
        totalAmount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        totalBonuses: 0,
        pendingSalaryRequests: 0,
      });
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#ededed] mb-2">
            Управление обработкой
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60">
            Настройки системы обработки депозитов и управление процессорами
          </p>
        </div>

        {/* Общая статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Всего депозитов</h3>
              <div className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">{stats.totalDeposits}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">${stats.totalAmount.toLocaleString()}</div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Статусы</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-600">Ожидание:</span>
                  <span>{stats.pendingCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Подтверждено:</span>
                  <span>{stats.approvedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Отклонено:</span>
                  <span>{stats.rejectedCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Бонусы</h3>
              <div className="text-2xl font-bold text-green-600">${stats.totalBonuses.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Начислено всего</div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Заявки на ЗП</h3>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingSalaryRequests}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">В ожидании</div>
            </div>
          </div>
        )}

        {/* Табы */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Обзор
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "settings"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Настройки бонусов
              </button>
              <button
                onClick={() => setActiveTab("processors")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "processors"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Процессоры
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  Общий обзор системы обработки
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Система обработки депозитов готова к использованию. 
                    Здесь будет отображаться статистика и последние активности.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    Настройки бонусов и комиссий
                  </h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Добавить настройку
                  </button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Настройки математики</h4>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <p className="mb-2"><strong>Пример математики:</strong></p>
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Депозит: $100</li>
                          <li>30% - комиссия (настраивается в админке)</li>
                          <li>5% - базовый бонус обработчика</li>
                          <li>Если сумма за день ≥ $900 → 10% бонус вместо 5%</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Настройки в разработке</h3>
                  <p className="text-gray-500 dark:text-gray-400">Интерфейс управления бонусной сеткой будет добавлен в следующей итерации</p>
                </div>
              </div>
            )}

            {activeTab === "processors" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  Управление процессорами
                </h3>

                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет процессоров</h3>
                  <p className="text-gray-500 dark:text-gray-400">Пользователи с ролью PROCESSOR появятся здесь автоматически</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
