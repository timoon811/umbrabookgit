"use client";

import { useState, useEffect } from "react";
import SalaryRequestsTab from "@/components/admin/SalaryRequestsTab";
import SalarySettingsTab from "@/components/admin/SalarySettingsTab";
import ShiftScheduleTab from "@/components/admin/ShiftScheduleTab";
import ShiftLogsTab from "@/components/admin/ShiftLogsTab";


interface DepositData {
  id: string;
  amount: number;
  currency: string;
  currencyType: string;
  playerEmail: string;
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
}


interface Manager {
  id: string;
  name: string;
  email: string;
  telegram?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalDeposits: number;
    totalAmount: number;
    totalBonuses: number;
    avgBonusRate: number;
    thisMonthDeposits: number;
    thisMonthAmount: number;
    thisMonthBonuses: number;
  };
  settings: {
    baseRate: number;
    bonusPercentage: number;
    fixedBonus: number;
    customBonusRules: string;
  };
  salary: {
    baseSalary: number;
    commissionRate: number;
    bonusMultiplier: number;
    lastPaid: string | null;
    totalPaid: number;
  };
}

interface ManagerFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}


export default function AdminProcessingPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeShiftSubTab, setActiveShiftSubTab] = useState("logs"); // logs или settings
  const [activeSalarySubTab, setActiveSalarySubTab] = useState("requests"); // requests или settings
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [analytics, setAnalytics] = useState<DepositsAnalytics | null>(null);
  const [platformCommission, setPlatformCommission] = useState(5.0); // Процент комиссии платформы
  const [filters, setFilters] = useState({
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
  
  // Состояния для управления депозитами
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositData | null>(null);
  const [processors, setProcessors] = useState<Array<{id: string, name: string, email: string}>>([]);


  // Состояния для управления менеджерами
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managerFilters, setManagerFilters] = useState<ManagerFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showBonusesModal, setShowBonusesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);


  useEffect(() => {
    loadData();
    loadProcessors();
    loadManagers();
  }, []);

  useEffect(() => {
    if (activeTab === "deposits") {
      loadDeposits();
      loadPlatformCommission();
    }
  }, [activeTab, filters, pagination.page, sortBy, sortOrder]);

  const loadPlatformCommission = async () => {
    try {
      const response = await fetch('/api/admin/platform-commission', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.commission) {
          setPlatformCommission(data.commission.commissionPercent);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек комиссии:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Здесь может быть дополнительная логика загрузки при необходимости
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

  // Функции для управления депозитами
  const handleEditDeposit = (deposit: DepositData) => {
    setSelectedDeposit(deposit);
    setShowEditModal(true);
  };

  const handleDeleteDeposit = (deposit: DepositData) => {
    setSelectedDeposit(deposit);
    setShowDeleteModal(true);
  };

  const handleTransferDeposit = (deposit: DepositData) => {
    setSelectedDeposit(deposit);
    setShowTransferModal(true);
  };

  const confirmDeleteDeposit = async () => {
    if (!selectedDeposit) return;
    
    try {
      const response = await fetch(`/api/admin/deposits/manage?depositId=${selectedDeposit.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Обновляем список депозитов
        loadDeposits();
        setShowDeleteModal(false);
        setSelectedDeposit(null);
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления депозита:", error);
      alert("Ошибка при удалении депозита");
    }
  };

  const confirmTransferDeposit = async (newProcessorId: string) => {
    if (!selectedDeposit) return;
    
    try {
      const response = await fetch('/api/admin/deposits/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositId: selectedDeposit.id,
          newProcessorId,
        }),
      });
      
      if (response.ok) {
        // Обновляем список депозитов
        loadDeposits();
        setShowTransferModal(false);
        setSelectedDeposit(null);
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка передачи депозита:", error);
      alert("Ошибка при передаче депозита");
    }
  };

  const loadProcessors = async () => {
    try {
      const response = await fetch('/api/admin/users?role=PROCESSOR');
      if (response.ok) {
        const data = await response.json();
        setProcessors(data.users || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки процессоров:", error);
    }
  };


  // Функции для управления менеджерами
  const loadManagers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=PROCESSOR');
      if (response.ok) {
        const users = await response.json();
        
        // Преобразуем пользователей в менеджеров с дополнительными данными
        const managersData = await Promise.all(
          users.users.map(async (user: { id: string; name: string; email: string; telegram?: string; isBlocked: boolean; createdAt: string; updatedAt: string }) => {
            // Получаем статистику менеджера
            const statsResponse = await fetch(`/api/admin/managers/${user.id}/stats`);
            const stats = statsResponse.ok ? await statsResponse.json() : {
              totalDeposits: 0,
              totalAmount: 0,
              totalBonuses: 0,
              avgBonusRate: 0,
              thisMonthDeposits: 0,
              thisMonthAmount: 0,
              thisMonthBonuses: 0
            };

            // Получаем настройки менеджера
            const settingsResponse = await fetch(`/api/admin/managers/${user.id}/settings`);
            const settings = settingsResponse.ok ? await settingsResponse.json() : {
              baseRate: 5.0,
              bonusPercentage: 0,
              fixedBonus: 0,
              customBonusRules: ''
            };

            // Получаем данные о зарплате
            const salaryResponse = await fetch(`/api/admin/managers/${user.id}/salary`);
            const salary = salaryResponse.ok ? await salaryResponse.json() : {
              baseSalary: 0,
              commissionRate: 0,
              bonusMultiplier: 1.0,
              lastPaid: null,
              totalPaid: 0
            };

            return {
              ...user,
              stats,
              settings,
              salary
            };
          })
        );

        setManagers(managersData);
      }
    } catch (error) {
      console.error("Ошибка загрузки менеджеров:", error);
    }
  };

  const handleEditManager = (manager: Manager) => {
    setEditingManager(manager);
    setShowManagerModal(true);
  };

  const handleManagerSalary = (manager: Manager) => {
    setSelectedManager(manager);
    setShowSalaryModal(true);
  };

  const handleManagerBonuses = (manager: Manager) => {
    setSelectedManager(manager);
    setShowBonusesModal(true);
  };

  const handleManagerStats = (manager: Manager) => {
    setSelectedManager(manager);
    setShowStatsModal(true);
  };

  const handleToggleManagerStatus = async (manager: Manager) => {
    const action = manager.isBlocked ? 'разблокировать' : 'заблокировать';
    if (!confirm(`Вы уверены, что хотите ${action} менеджера ${manager.name}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${manager.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !manager.isBlocked })
      });

      if (response.ok) {
        await loadManagers();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка изменения статуса менеджера:", error);
      alert("Ошибка при изменении статуса");
    }
  };

  const saveManagerSettings = async (managerId: string, settings: { baseRate: number; bonusPercentage: number; fixedBonus: number; customBonusRules: string }) => {
    try {
      const response = await fetch(`/api/admin/managers/${managerId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        await loadManagers();
        return true;
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error("Ошибка сохранения настроек менеджера:", error);
      alert("Ошибка при сохранении настроек");
      return false;
    }
  };

  const saveManagerSalary = async (managerId: string, salary: { baseSalary: number; commissionRate: number; bonusMultiplier: number; lastPaid: string | null; totalPaid: number }) => {
    try {
      const response = await fetch(`/api/admin/managers/${managerId}/salary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salary)
      });

      if (response.ok) {
        await loadManagers();
        return true;
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error("Ошибка сохранения зарплаты менеджера:", error);
      alert("Ошибка при сохранении зарплаты");
      return false;
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
      {/* Закрепленные табы как второй header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <nav className="flex space-x-2 lg:space-x-3 px-4 lg:px-6 min-w-max py-3 lg:py-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-shrink-0 py-2 px-3 lg:px-4 font-medium text-xs lg:text-sm whitespace-nowrap rounded-lg transition-colors ${
                  activeTab === "overview"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                Обзор
              </button>
              <button
                onClick={() => setActiveTab("deposits")}
                className={`flex-shrink-0 py-2 px-3 lg:px-4 font-medium text-xs lg:text-sm whitespace-nowrap rounded-lg transition-colors ${
                  activeTab === "deposits"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                Депозиты
              </button>
              <button
                onClick={() => setActiveTab("managers")}
                className={`flex-shrink-0 py-2 px-3 lg:px-4 font-medium text-xs lg:text-sm whitespace-nowrap rounded-lg transition-colors ${
                  activeTab === "managers"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                Менеджеры
              </button>
              <button
                onClick={() => setActiveTab("salaryRequests")}
                className={`flex-shrink-0 py-2 px-3 lg:px-4 font-medium text-xs lg:text-sm whitespace-nowrap rounded-lg transition-colors ${
                  activeTab === "salaryRequests"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                ЗП
              </button>
              <button
                onClick={() => setActiveTab("shifts")}
                className={`flex-shrink-0 py-2 px-3 lg:px-4 font-medium text-xs lg:text-sm whitespace-nowrap rounded-lg transition-colors ${
                  activeTab === "shifts"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                Смены
              </button>
          </nav>
        </div>
      </div>

      {/* Основной контент с отступом от закрепленного header */}
      <div className="p-4 lg:p-6">
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                  <h3 className="text-base lg:text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    Все депозиты обработчиков
                  </h3>
                </div>

                {/* Аналитика - адаптивная версия */}
                {analytics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
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

                {/* Фильтры - адаптивная версия */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 lg:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">

                    
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

                {/* Таблица депозитов - адаптивная версия */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th 
                          className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort("createdAt")}
                        >
                          Дата {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th 
                          className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort("amount")}
                        >
                          Сумма {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Чистая сумма
                        </th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Валюта
                        </th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email депозитера
                        </th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Обработчик
                        </th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Заметки
                        </th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {deposits.map((deposit) => (
                        <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(deposit.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {deposit.amount.toLocaleString()} {deposit.currency}
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex flex-col">
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {(deposit.amount * (1 - platformCommission / 100)).toLocaleString()} {deposit.currency}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                -{platformCommission}% комиссия
                              </span>
                            </div>
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              deposit.currencyType === 'CRYPTO' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {deposit.currency}
                            </span>
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {deposit.playerEmail}
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div>
                              <div className="font-medium">{deposit.processor.name}</div>
                              <div className="text-gray-500 dark:text-gray-400">{deposit.processor.email}</div>
                            </div>
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                            {deposit.notes || '-'}
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditDeposit(deposit)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Редактировать"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleTransferDeposit(deposit)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Передать другому обработчику"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => handleDeleteDeposit(deposit)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Удалить"
                              >
                                🗑️
                              </button>
                            </div>
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


            {activeTab === "managers" && (
              <div className="space-y-4">{/* Убран заголовок и кнопка добавления менеджера */}

                {/* Фильтры и поиск */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Поиск</label>
                      <input
                        type="text"
                        placeholder="Имя, email..."
                        value={managerFilters.search}
                        onChange={(e) => setManagerFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                      <select
                        value={managerFilters.status}
                        onChange={(e) => setManagerFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">Все</option>
                        <option value="active">Активные</option>
                        <option value="blocked">Заблокированные</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Сортировка</label>
                      <select
                        value={managerFilters.sortBy}
                        onChange={(e) => setManagerFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="name">По имени</option>
                        <option value="totalDeposits">По депозитам</option>
                        <option value="totalAmount">По объему</option>
                        <option value="totalBonuses">По бонусам</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Таблица менеджеров */}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-[#171717]/[0.02] dark:bg-[#ededed]/5 border-b border-[#171717]/5 dark:border-[#ededed]/10">
                        <tr>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider cursor-pointer hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 transition-colors"
                            onClick={() => {
                              const newSortBy = 'name';
                              setManagerFilters(prev => ({ 
                                ...prev, 
                                sortBy: newSortBy,
                                sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
                              }));
                            }}
                          >
                            <div className="flex items-center gap-1">
                              Менеджер
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider cursor-pointer hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 transition-colors"
                            onClick={() => {
                              const newSortBy = 'totalDeposits';
                              setManagerFilters(prev => ({ 
                                ...prev, 
                                sortBy: newSortBy,
                                sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
                              }));
                            }}
                          >
                            <div className="flex items-center gap-1">
                              Депозиты
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider cursor-pointer hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 transition-colors"
                            onClick={() => {
                              const newSortBy = 'totalAmount';
                              setManagerFilters(prev => ({ 
                                ...prev, 
                                sortBy: newSortBy,
                                sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
                              }));
                            }}
                          >
                            <div className="flex items-center gap-1">
                              Объем
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider cursor-pointer hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 transition-colors"
                            onClick={() => {
                              const newSortBy = 'totalBonuses';
                              setManagerFilters(prev => ({ 
                                ...prev, 
                                sortBy: newSortBy,
                                sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
                              }));
                            }}
                          >
                            <div className="flex items-center gap-1">
                              Заработано
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                            Настройки
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                            Статус
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#171717]/5 dark:divide-[#ededed]/10">
                        {(() => {
                          // Фильтрация и сортировка менеджеров
                          const filteredManagers = managers.filter(manager => {
                            // Поиск по имени и email
                            const searchMatch = !managerFilters.search || 
                              manager.name.toLowerCase().includes(managerFilters.search.toLowerCase()) ||
                              manager.email.toLowerCase().includes(managerFilters.search.toLowerCase());
                            
                            // Фильтр по статусу
                            const statusMatch = managerFilters.status === 'all' ||
                              (managerFilters.status === 'active' && !manager.isBlocked) ||
                              (managerFilters.status === 'blocked' && manager.isBlocked);
                            
                            return searchMatch && statusMatch;
                          });
                          
                          // Сортировка
                          filteredManagers.sort((a, b) => {
                            let valueA: string | number, valueB: string | number;
                            
                            switch (managerFilters.sortBy) {
                              case 'name':
                                valueA = a.name.toLowerCase();
                                valueB = b.name.toLowerCase();
                                break;
                              case 'totalDeposits':
                                valueA = a.stats.totalDeposits;
                                valueB = b.stats.totalDeposits;
                                break;
                              case 'totalAmount':
                                valueA = a.stats.totalAmount;
                                valueB = b.stats.totalAmount;
                                break;
                              case 'totalBonuses':
                                valueA = a.stats.totalBonuses;
                                valueB = b.stats.totalBonuses;
                                break;
                              default:
                                valueA = a.name.toLowerCase();
                                valueB = b.name.toLowerCase();
                            }
                            
                            if (typeof valueA === 'string' && typeof valueB === 'string') {
                              const comparison = valueA.localeCompare(valueB);
                              return managerFilters.sortOrder === 'asc' ? comparison : -comparison;
                            } else {
                              const comparison = (valueA as number) - (valueB as number);
                              return managerFilters.sortOrder === 'asc' ? comparison : -comparison;
                            }
                          });
                          
                          return filteredManagers;
                        })().map((manager) => (
                          <tr key={manager.id} className="hover:bg-[#171717]/[0.02] dark:hover:bg-[#ededed]/5 transition-colors">
                            {/* Менеджер */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    {manager.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                                    {manager.name}
                                  </div>
                                  <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                                    {manager.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Депозиты */}
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                                {manager.stats.totalDeposits}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                +{manager.stats.thisMonthDeposits} за месяц
                              </div>
                            </td>
                            
                            {/* Объем */}
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                                ${manager.stats.totalAmount.toLocaleString()}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                +${manager.stats.thisMonthAmount.toLocaleString()} за месяц
                              </div>
                            </td>
                            
                            {/* Заработано */}
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                ${manager.stats.totalBonuses.toLocaleString()}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                {manager.stats.avgBonusRate}% средний
                              </div>
                            </td>
                            
                            {/* Настройки */}
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="text-xs">
                                  <span className="text-[#171717]/60 dark:text-[#ededed]/60">База:</span>
                                  <span className="ml-1 font-medium text-[#171717] dark:text-[#ededed]">{manager.settings.baseRate}%</span>
                                </div>
                                <div className="text-xs">
                                  <span className="text-[#171717]/60 dark:text-[#ededed]/60">Бонус:</span>
                                  <span className="ml-1 font-medium text-[#171717] dark:text-[#ededed]">{manager.settings.bonusPercentage}%</span>
                                </div>
                                {manager.settings.fixedBonus > 0 && (
                                  <div className="text-xs">
                                    <span className="text-[#171717]/60 dark:text-[#ededed]/60">Фикс:</span>
                                    <span className="ml-1 font-medium text-[#171717] dark:text-[#ededed]">${manager.settings.fixedBonus}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            {/* Статус */}
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                manager.isBlocked 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {manager.isBlocked ? 'Заблокирован' : 'Активен'}
                              </span>
                            </td>
                            
                            {/* Действия */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditManager(manager)}
                                  className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                  title="Редактировать"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={() => handleManagerSalary(manager)}
                                  className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                  title="Управление ЗП"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={() => handleManagerBonuses(manager)}
                                  className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                                  title="Управление бонусами"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={() => handleManagerStats(manager)}
                                  className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                                  title="Детальная статистика"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={() => handleToggleManagerStatus(manager)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    manager.isBlocked
                                      ? 'text-[#171717]/60 dark:text-[#ededed]/60 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10'
                                      : 'text-[#171717]/60 dark:text-[#ededed]/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                                  }`}
                                  title={manager.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                                >
                                  {manager.isBlocked ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {(() => {
                          // Проверка на пустой список
                          const filteredManagers = managers.filter(manager => {
                            const searchMatch = !managerFilters.search || 
                              manager.name.toLowerCase().includes(managerFilters.search.toLowerCase()) ||
                              manager.email.toLowerCase().includes(managerFilters.search.toLowerCase());
                            
                            const statusMatch = managerFilters.status === 'all' ||
                              (managerFilters.status === 'active' && !manager.isBlocked) ||
                              (managerFilters.status === 'blocked' && manager.isBlocked);
                            
                            return searchMatch && statusMatch;
                          });
                          
                          return filteredManagers.length === 0;
                        })() && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center">
                              <div className="text-[#171717]/40 dark:text-[#ededed]/40">
                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                <p className="text-sm">Менеджеры не найдены</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}



            {activeTab === "salaryRequests" && (
              <div className="space-y-6">
                {/* Под-табы */}
                <div className="border-b border-[#171717]/5 dark:border-[#ededed]/10 pb-4">
                  <nav className="flex flex-wrap gap-4 lg:gap-8">
                    <button
                      onClick={() => setActiveSalarySubTab("requests")}
                      className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeSalarySubTab === "requests"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      Заявки на ЗП
                    </button>
                    <button
                      onClick={() => setActiveSalarySubTab("settings")}
                      className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeSalarySubTab === "settings"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      Настройки ЗП
                    </button>
                  </nav>
                </div>

                {/* Контент под-табов */}
                {activeSalarySubTab === "requests" && <SalaryRequestsTab />}
                {activeSalarySubTab === "settings" && <SalarySettingsTab />}
              </div>
            )}

            {activeTab === "shifts" && (
              <div className="space-y-6">
                {/* Под-табы */}
                <div className="border-b border-[#171717]/5 dark:border-[#ededed]/10 pb-4">
                  {/* Под-табы */}
                  <nav className="flex flex-wrap gap-4 lg:gap-8">
                    <button
                      onClick={() => setActiveShiftSubTab("logs")}
                      className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeShiftSubTab === "logs"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      Логи смен
                    </button>
                    <button
                      onClick={() => setActiveShiftSubTab("settings")}
                      className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeShiftSubTab === "settings"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      Настройки смен
                    </button>
                  </nav>
                </div>

                {/* Контент под-табов */}
                {activeShiftSubTab === "logs" && <ShiftLogsTab />}
                {activeShiftSubTab === "settings" && <ShiftScheduleTab />}
              </div>
            )}
      </div>

      {/* Модальные окна для управления депозитами */}
      
      {/* Модальное окно редактирования */}
      {showEditModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Редактировать депозит</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email депозитера</label>
                <input
                  type="email"
                  defaultValue={selectedDeposit.playerEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заметки</label>
                <textarea
                  defaultValue={selectedDeposit.notes || ""}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно удаления */}
      {showDeleteModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Удалить депозит</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Вы уверены, что хотите удалить депозит на сумму ${selectedDeposit.amount}? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteDeposit}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно передачи депозита */}
      {showTransferModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Передать депозит</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Выберите нового обработчика для депозита на сумму ${selectedDeposit.amount}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Новый обработчик</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Выберите обработчика</option>
                {processors.map(processor => (
                  <option key={processor.id} value={processor.id}>
                    {processor.name} ({processor.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  const select = document.querySelector('select') as HTMLSelectElement;
                  if (select && select.value) {
                    confirmTransferDeposit(select.value);
                  }
                }}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                Передать
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Модальные окна для управления менеджерами */}
      
      {/* Модальное окно редактирования менеджера */}
      {showManagerModal && (editingManager || selectedManager) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingManager ? 'Редактировать менеджера' : 'Информация о менеджере'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                  <input
                    type="text"
                    defaultValue={editingManager?.name || selectedManager?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={!editingManager}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={editingManager?.email || selectedManager?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={!editingManager}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram</label>
                  <input
                    type="text"
                    defaultValue={editingManager?.telegram || selectedManager?.telegram || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={!editingManager}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата регистрации</label>
                  <input
                    type="text"
                    value={editingManager?.createdAt || selectedManager?.createdAt ? new Date(editingManager?.createdAt || selectedManager?.createdAt || '').toLocaleDateString() : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
                    disabled
                  />
                </div>
              </div>

              {editingManager && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Настройки бонусов</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Базовая ставка (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={editingManager.settings.baseRate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Доп. процент (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={editingManager.settings.bonusPercentage}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фикс. бонус ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={editingManager.settings.fixedBonus}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowManagerModal(false);
                  setEditingManager(null);
                  setSelectedManager(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Закрыть
              </button>
              {editingManager && (
                <button
                  onClick={async () => {
                    // Здесь будет логика сохранения
                    await loadManagers();
                    setShowManagerModal(false);
                    setEditingManager(null);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Сохранить
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления зарплатой */}
      {showSalaryModal && selectedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Управление зарплатой - {selectedManager.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Базовая зарплата ($)</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={selectedManager.salary.baseSalary}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Комиссия (%)</label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={selectedManager.salary.commissionRate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Множитель бонусов</label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={selectedManager.salary.bonusMultiplier}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSalaryModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  // Здесь будет логика сохранения зарплаты
                  await loadManagers();
                  setShowSalaryModal(false);
                }}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно управления бонусами */}
      {showBonusesModal && selectedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Управление бонусами - {selectedManager.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дополнительный процент (%)</label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={selectedManager.settings.bonusPercentage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фиксированный бонус ($)</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={selectedManager.settings.fixedBonus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Правила бонусов (JSON)</label>
                <textarea
                  defaultValue={selectedManager.settings.customBonusRules}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder='{"minDeposits": 50, "bonus": 2.5}'
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBonusesModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  // Здесь будет логика сохранения бонусов
                  await loadManagers();
                  setShowBonusesModal(false);
                }}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно детальной статистики */}
      {showStatsModal && selectedManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Детальная статистика - {selectedManager.name}
            </h3>
            
            <div className="space-y-6">
              {/* Общая статистика */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Общая статистика</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedManager.stats.totalDeposits}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Всего депозитов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${selectedManager.stats.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Общий объем</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">${selectedManager.stats.totalBonuses.toLocaleString()}</div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Заработано</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{selectedManager.stats.avgBonusRate}%</div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">Средний бонус</div>
                  </div>
                </div>
              </div>

              {/* Статистика за месяц */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">Статистика за текущий месяц</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{selectedManager.stats.thisMonthDeposits}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Депозитов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">${selectedManager.stats.thisMonthAmount.toLocaleString()}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Объем</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">${selectedManager.stats.thisMonthBonuses.toLocaleString()}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Бонусы</div>
                  </div>
                </div>
              </div>

              {/* Настройки */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-3">Текущие настройки</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600 dark:text-purple-400">Базовая ставка:</span>
                    <span className="ml-2 font-medium">{selectedManager.settings.baseRate}%</span>
                  </div>
                  <div>
                    <span className="text-purple-600 dark:text-purple-400">Доп. процент:</span>
                    <span className="ml-2 font-medium">{selectedManager.settings.bonusPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-purple-600 dark:text-purple-400">Фикс. бонус:</span>
                    <span className="ml-2 font-medium">${selectedManager.settings.fixedBonus}</span>
                  </div>
                  <div>
                    <span className="text-purple-600 dark:text-purple-400">Множитель:</span>
                    <span className="ml-2 font-medium">{selectedManager.salary.bonusMultiplier}x</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowStatsModal(false)}
                className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
