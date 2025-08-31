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

interface DepositData {
  id: string;
  amount: number;
  currency: string;
  currencyType: string;
  playerEmail: string;
  status: string;
  createdAt: string;
  processor: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
}

interface DepositsAnalytics {
  total: {
    amount: number;
    bonusAmount: number;
    count: number;
  };
  currencies: Array<{
    currency: string;
    currencyType: string;
    amount: number;
    count: number;
  }>;
  processors: Array<{
    processorId: string;
    processor: {
      id: string;
      name: string;
      email: string;
    } | null;
    amount: number;
    bonusAmount: number;
    count: number;
  }>;
  statuses: Array<{
    status: string;
    amount: number;
    count: number;
  }>;
}

export default function AdminProcessingPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<ProcessorStats | null>(null);
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [analytics, setAnalytics] = useState<DepositsAnalytics | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    currency: "all",
    currencyType: "all",
    processorId: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "deposits") {
      loadDeposits();
    }
  }, [activeTab, filters, pagination.page, sortBy, sortOrder]);

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

  const loadDeposits = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== "all")),
      });

      const response = await fetch(`/api/admin/deposits?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDeposits(data.deposits);
        setAnalytics(data.analytics);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Ошибка загрузки депозитов:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Сброс на первую страницу
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPagination(prev => ({ ...prev, page: 1 })); // Сброс на первую страницу
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
                onClick={() => setActiveTab("deposits")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "deposits"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Все депозиты
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

            {activeTab === "deposits" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    Все депозиты обработчиков
                  </h3>
                </div>

                {/* Аналитика */}
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Общая сумма</h4>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${analytics.total.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {analytics.total.count} депозитов
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">Бонусы</h4>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${analytics.total.bonusAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Начислено</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">Криптовалюты</h4>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {analytics.currencies.filter(c => c.currencyType === 'CRYPTO').length}
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">Видов</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">Обработчиков</h4>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {analytics.processors.length}
                      </div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">Активных</div>
                    </div>
                  </div>
                )}

                {/* Фильтры */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Статус
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="all">Все</option>
                        <option value="PENDING">Ожидание</option>
                        <option value="APPROVED">Подтверждено</option>
                        <option value="REJECTED">Отклонено</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Тип валюты
                      </label>
                      <select
                        value={filters.currencyType}
                        onChange={(e) => handleFilterChange("currencyType", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="all">Все</option>
                        <option value="FIAT">Фиат</option>
                        <option value="CRYPTO">Криптовалюты</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Валюта
                      </label>
                      <select
                        value={filters.currency}
                        onChange={(e) => handleFilterChange("currency", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="all">Все</option>
                        {analytics?.currencies.map(c => (
                          <option key={c.currency} value={c.currency}>
                            {c.currency} ({c.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        От даты
                      </label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        До даты
                      </label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Поиск
                      </label>
                      <input
                        type="text"
                        placeholder="Email, имя..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Таблица депозитов */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort("createdAt")}
                        >
                          Дата {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort("amount")}
                        >
                          Сумма {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Валюта
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email депозитера
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Обработчик
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Заметки
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {deposits.map((deposit) => (
                        <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(deposit.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {deposit.amount.toLocaleString()} {deposit.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              deposit.currencyType === 'CRYPTO' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {deposit.currency}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {deposit.playerEmail}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div>
                              <div className="font-medium">{deposit.processor.name}</div>
                              <div className="text-gray-500 dark:text-gray-400">{deposit.processor.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              deposit.status === 'APPROVED' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : deposit.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {deposit.status === 'APPROVED' ? 'Одобрен' : deposit.status === 'REJECTED' ? 'Отклонён' : 'Ожидание'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                            {deposit.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Пагинация */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Показано {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Предыдущая
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      Страница {pagination.page} из {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Следующая
                    </button>
                  </div>
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
