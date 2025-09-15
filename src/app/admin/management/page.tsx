"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getUserInitial } from "@/utils/userUtils";
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
  playerId?: string;
  notes?: string;
  paymentMethod?: string;
  createdAt: string;
  processor: {
    id: string;
    name: string;
    email: string;
  };
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


export default function AdminManagementPage() {
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
  
  // Состояния для редактирования депозита
  const [editForm, setEditForm] = useState({
    amount: 0,
    currency: '',
    playerEmail: '',
    notes: '',
    paymentMethod: ''
  });
  // Состояния для управления менеджерами
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managerFilters, setManagerFilters] = useState<ManagerFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'block' | 'unblock';
    manager: Manager | null;
  }>({ type: 'block', manager: null });


  useEffect(() => {
    loadData();
    loadManagers();
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
    setEditForm({
      amount: deposit.amount,
      currency: deposit.currency,
      playerEmail: deposit.playerEmail,
      notes: deposit.notes || '',
      paymentMethod: deposit.paymentMethod || ''
    });
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

  const saveDepositChanges = async () => {
    if (!selectedDeposit) return;
    
    try {
      const response = await fetch(`/api/admin/deposits/manage?depositId=${selectedDeposit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (response.ok) {
        // Обновляем список депозитов
        loadDeposits();
        setShowEditModal(false);
        setSelectedDeposit(null);
        toast.success('Депозит успешно обновлен');
      } else {
        const error = await response.json();
        toast.error(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка при обновлении депозита:', error);
      toast.error('Ошибка при обновлении депозита');
    }
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
        toast.error(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления депозита:", error);
      toast.error("Ошибка при удалении депозита");
    }
  };

  const confirmTransferDeposit = async (newManagerId: string) => {
    if (!selectedDeposit) return;
    
    try {
      const response = await fetch('/api/admin/deposits/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositId: selectedDeposit.id,
          newManagerId,
        }),
      });
      
      if (response.ok) {
        // Обновляем список депозитов
        loadDeposits();
        setShowTransferModal(false);
        setSelectedDeposit(null);
      } else {
        const error = await response.json();
        toast.error(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка передачи депозита:", error);
      toast.error("Ошибка при передаче депозита");
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


  const handleToggleManagerStatus = (manager: Manager) => {
    setConfirmAction({
      type: manager.isBlocked ? 'unblock' : 'block',
      manager
    });
    setShowConfirmModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!confirmAction.manager) return;

    try {
      const response = await fetch(`/api/admin/users/${confirmAction.manager.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !confirmAction.manager.isBlocked })
      });

      if (response.ok) {
        await loadManagers();
        const action = confirmAction.type === 'block' ? 'заблокирован' : 'разблокирован';
        toast.success(`Менеджер ${confirmAction.manager.name} успешно ${action}`);
      } else {
        const error = await response.json();
        toast.error(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка изменения статуса менеджера:", error);
      toast.error("Ошибка при изменении статуса");
    } finally {
      setShowConfirmModal(false);
      setConfirmAction({ type: 'block', manager: null });
    }
  };


  const saveManagerSalary = async (processorId: string, salary: { baseSalary: number; commissionRate: number; bonusMultiplier: number; lastPaid: string | null; totalPaid: number }) => {
    try {
      const response = await fetch(`/api/admin/managers/${processorId}/salary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salary)
      });

      if (response.ok) {
        await loadManagers();
        return true;
      } else {
        const error = await response.json();
        toast.error(`Ошибка: ${error.error}`);
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
                    Все депозиты менеджеров
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
                      <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">Менеджеров</h4>
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
                          Менеджер
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
                            ${deposit.amount.toLocaleString()}
                          </td>
                          <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex flex-col">
                              <span className="font-medium text-green-600 dark:text-green-400">
                                ${(deposit.amount * (1 - platformCommission / 100)).toLocaleString()}
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
                                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Редактировать"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleTransferDeposit(deposit)}
                                className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Передать другому менеджеру"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteDeposit(deposit)}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Удалить"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
                                    {'M'}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Редактировать депозит</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Сумма депозита *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Валюта *
                </label>
                <select
                  value={editForm.currency}
                  onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите валюту</option>
                  <option value="USDT_TRC20">USDT (TRC20)</option>
                  <option value="USDT_ERC20">USDT (ERC20)</option>
                  <option value="BTC">Bitcoin</option>
                  <option value="ETH">Ethereum</option>
                  <option value="LTC">Litecoin</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="RUB">RUB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email депозитера *
                </label>
                <input
                  type="email"
                  value={editForm.playerEmail}
                  onChange={(e) => setEditForm(prev => ({ ...prev, playerEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Способ оплаты
                </label>
                <input
                  type="text"
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  placeholder="Например: Банковская карта, PayPal, криптовалюта"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>


              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Заметки администратора
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Внутренние заметки для администраторов"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Отмена
              </button>
              <button 
                onClick={saveDepositChanges}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Сохранить изменения
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
              Выберите нового менеджера для депозита на сумму ${selectedDeposit.amount}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Новый менеджер</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Выберите менеджера</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
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
        <EditManagerModal
          manager={editingManager || selectedManager}
          onClose={() => {
            setShowManagerModal(false);
            setEditingManager(null);
            setSelectedManager(null);
          }}
          onSave={async (managerData) => {
            // Логика сохранения изменений менеджера
            try {
              const response = await fetch(`/api/admin/users/${managerData.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: managerData.name,
                  email: managerData.email,
                  role: managerData.role,
                  password: managerData.password || undefined,
                }),
              });
              
              if (response.ok) {
                await loadManagers();
                setShowManagerModal(false);
                setEditingManager(null);
                setSelectedManager(null);
                toast.success('Менеджер успешно обновлен');
              } else {
                const error = await response.json();
                toast.error(`Ошибка: ${error.error}`);
              }
            } catch (error) {
              console.error('Ошибка при обновлении менеджера:', error);
              toast.error('Ошибка при сохранении изменений');
            }
          }}
          isEditing={!!editingManager}
        />
      )}

      {/* Красивое модальное окно подтверждения */}
      {showConfirmModal && confirmAction.manager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-[#171717]/10 dark:border-[#ededed]/10 w-full max-w-md overflow-hidden shadow-2xl">
            {/* Заголовок */}
            <div className="p-6 border-b border-[#171717]/10 dark:border-[#ededed]/10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmAction.type === 'block' 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  {confirmAction.type === 'block' ? (
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    {confirmAction.type === 'block' ? 'Заблокировать менеджера' : 'Разблокировать менеджера'}
                  </h3>
                  <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                    Это действие изменит доступ пользователя к системе
                  </p>
                </div>
              </div>
            </div>
            
            {/* Содержимое */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3 p-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {confirmAction.manager.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-[#171717] dark:text-[#ededed]">
                      {confirmAction.manager.name}
                    </div>
                    <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                      {confirmAction.manager.email}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-[#171717]/70 dark:text-[#ededed]/70 leading-relaxed">
                {confirmAction.type === 'block' 
                  ? 'Вы уверены, что хотите заблокировать этого менеджера? Пользователь потеряет доступ к системе и не сможет входить в аккаунт.'
                  : 'Вы уверены, что хотите разблокировать этого менеджера? Пользователь получит доступ к системе и сможет войти в аккаунт.'
                }
              </p>
            </div>
            
            {/* Кнопки действий */}
            <div className="p-6 bg-[#171717]/2 dark:bg-[#ededed]/2 border-t border-[#171717]/10 dark:border-[#ededed]/10">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction({ type: 'block', manager: null });
                  }}
                  className="flex-1 px-4 py-2.5 border border-[#171717]/10 dark:border-[#ededed]/10 text-[#171717] dark:text-[#ededed] rounded-xl hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-all duration-200 font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmToggleStatus}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    confirmAction.type === 'block'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25'
                  }`}
                >
                  {confirmAction.type === 'block' ? 'Заблокировать' : 'Разблокировать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Edit Manager Modal Component
function EditManagerModal({ 
  manager, 
  onClose, 
  onSave,
  isEditing 
}: {
  manager: Manager | null;
  onClose: () => void;
  onSave: (managerData: any) => void;
  isEditing: boolean;
}) {
  const [formData, setFormData] = useState({
    id: manager?.id || '',
    name: manager?.name || '',
    email: manager?.email || '',
    role: manager?.role || 'PROCESSOR',
    password: '',
  });

  const [shiftsData, setShiftsData] = useState<{
    shifts: Array<{
      id: string;
      shiftType: string;
      name: string;
      timeDisplay: string;
      isActive: boolean;
      isAssigned: boolean;
      description?: string;
    }>;
    assignedCount: number;
  } | null>(null);
  const [shiftsLoading, setShiftsLoading] = useState(false);

  // Загружаем смены при открытии модального окна
  useEffect(() => {
    if (formData.role === 'PROCESSOR' && manager?.id) {
      loadUserShifts();
    } else {
      // Сброс данных смен если роль изменилась на не-PROCESSOR
      setShiftsData(null);
    }
  }, [manager?.id, formData.role]);

  const loadUserShifts = async () => {
    if (!manager?.id) return;
    
    setShiftsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${manager.id}/shifts`);
      if (response.ok) {
        const data = await response.json();
        setShiftsData(data);
      } else {
        const errorData = await response.json();
        console.error('Ошибка API загрузки смен:', errorData);
        setShiftsData({ shifts: [], assignedCount: 0 });
      }
    } catch (error) {
      console.error('Ошибка загрузки смен:', error);
      setShiftsData({ shifts: [], assignedCount: 0 });
    } finally {
      setShiftsLoading(false);
    }
  };

  const handleShiftToggle = (shiftId: string) => {
    if (!shiftsData) return;
    
    setShiftsData({
      ...shiftsData,
      shifts: shiftsData.shifts.map(shift => 
        shift.id === shiftId 
          ? { ...shift, isAssigned: !shift.isAssigned }
          : shift
      )
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing) {
      onClose();
      return;
    }

    try {
      // Сохраняем изменения смен, если они есть
      if (shiftsData && formData.role === 'PROCESSOR') {
        const assignedShifts = shiftsData.shifts.filter(s => s.isAssigned).map(s => s.id);
        
        const shiftsResponse = await fetch(`/api/admin/users/${manager?.id}/shifts`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shiftIds: assignedShifts }),
        });

        if (!shiftsResponse.ok) {
          const shiftsError = await shiftsResponse.json();
          console.error('Ошибка обновления смен:', shiftsError);
        }
      }

      // Сохраняем основные данные пользователя
      onSave(formData);
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/10 dark:border-[#ededed]/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#171717]/10 dark:border-[#ededed]/10">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
            {isEditing ? 'Редактировать менеджера' : 'Информация о менеджере'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#171717]/40 dark:text-[#ededed]/40 hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#171717]/5 text-[#171717] dark:text-[#ededed]"
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#171717]/5 text-[#171717] dark:text-[#ededed]"
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Роль
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#171717]/5 text-[#171717] dark:text-[#ededed]"
                  disabled={!isEditing}
                >
                  <option value="PROCESSOR">Менеджер депозитов</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                    Новый пароль (оставьте пустым, если не хотите менять)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#171717]/5 text-[#171717] dark:text-[#ededed]"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>

            {/* Смены для процессоров/менеджеров */}
            {formData.role === 'PROCESSOR' && isEditing && (
              <div>
                <h3 className="text-md font-medium text-[#171717] dark:text-[#ededed] mb-3">
                  Назначенные смены
                </h3>
                {shiftsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-2">Загрузка смен...</p>
                  </div>
                ) : shiftsData ? (
                  <div className="space-y-2">
                    {shiftsData.shifts.length > 0 ? (
                      shiftsData.shifts.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between p-3 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-[#171717] dark:text-[#ededed]">
                              {shift.name}
                            </div>
                            <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                              {shift.timeDisplay} • {shift.shiftType}
                            </div>
                            {shift.description && (
                              <div className="text-xs text-[#171717]/40 dark:text-[#ededed]/40 mt-1">
                                {shift.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center ml-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={shift.isAssigned}
                                onChange={() => handleShiftToggle(shift.id)}
                              />
                              <div className="w-11 h-6 bg-[#171717]/20 dark:bg-[#ededed]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#171717]/60 dark:text-[#ededed]/60 text-center py-4">
                        Нет доступных смен
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-red-500 text-center py-4">
                    Ошибка загрузки смен
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 text-[#171717] dark:text-[#ededed] rounded-lg hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
            >
              {isEditing ? 'Отмена' : 'Закрыть'}
            </button>
            {isEditing && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Сохранить
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
