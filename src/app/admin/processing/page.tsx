"use client";

import { useState, useEffect } from "react";
import SalaryRequestsTab from "@/components/admin/SalaryRequestsTab";

interface ProcessorStats {
  totalDeposits: number;
  totalAmount: number;
  totalBonuses: number;
  pendingSalaryRequests: number;
}

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

interface BonusSettings {
  id: string;
  name: string;
  description?: string;
  baseCommissionRate: number;
  baseBonusRate: number;
  tiers: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BonusGrid {
  id: string;
  minAmount: number;
  maxAmount?: number;
  bonusPercentage: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BonusMotivation {
  id: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  name: string;
  description?: string;
  value: number;
  conditions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
}

// Типы для материалов обработки
interface ProcessingInstruction {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  isActive: boolean;
  isPublic: boolean;
  targetRoles?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcessingScript {
  id: string;
  title: string;
  content: string;
  description?: string;
  category: string;
  language: string;
  isActive: boolean;
  isPublic: boolean;
  targetRoles?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProcessingResource {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  url?: string;
  filePath?: string;
  order: number;
  isActive: boolean;
  isPublic: boolean;
  targetRoles?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcessingTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  type: string;
  variables?: string;
  isActive: boolean;
  isPublic: boolean;
  targetRoles?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProcessingPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<ProcessorStats | null>(null);
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [analytics, setAnalytics] = useState<DepositsAnalytics | null>(null);
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

  // Состояния для бонусной системы
  const [bonusSettings, setBonusSettings] = useState<BonusSettings | null>(null);
  const [bonusGrids, setBonusGrids] = useState<BonusGrid[]>([]);
  const [bonusMotivations, setBonusMotivations] = useState<BonusMotivation[]>([]);
  const [showBonusGridModal, setShowBonusGridModal] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [editingBonusGrid, setEditingBonusGrid] = useState<BonusGrid | null>(null);
  const [editingMotivation, setEditingMotivation] = useState<BonusMotivation | null>(null);

  // Состояния для управления менеджерами
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managerFilters, setManagerFilters] = useState<ManagerFilters>({
    search: '',
    status: 'all',
    sortBy: 'name'
  });
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showBonusesModal, setShowBonusesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);

  // Новые состояния для инструкций и скриптов
  const [instructions, setInstructions] = useState<ProcessingInstruction[]>([]);
  const [scripts, setScripts] = useState<ProcessingScript[]>([]);
  const [resources, setResources] = useState<ProcessingResource[]>([]);
  const [templates, setTemplates] = useState<ProcessingTemplate[]>([]);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<ProcessingInstruction | null>(null);
  const [editingScript, setEditingScript] = useState<ProcessingScript | null>(null);
  const [editingResource, setEditingResource] = useState<ProcessingResource | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ProcessingTemplate | null>(null);

  useEffect(() => {
    loadData();
    loadProcessors();
    loadBonusSettings();
    loadManagers();
    loadProcessingMaterials();
  }, []);

  useEffect(() => {
    if (activeTab === "deposits") {
      loadDeposits();
    }
  }, [activeTab, filters, pagination.page, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем статистику по заявкам на ЗП
      const salaryResponse = await fetch('/api/admin/salary-requests?limit=1');
      let pendingSalaryRequests = 0;
      
      if (salaryResponse.ok) {
        const salaryData = await salaryResponse.json();
        pendingSalaryRequests = salaryData.salaryRequests.filter((r: { status: string }) => r.status === 'PENDING').length;
      }
      
      // Заглушка для остальной статистики
      setStats({
        totalDeposits: 0,
        totalAmount: 0,
        totalBonuses: 0,
        pendingSalaryRequests,
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

  // Функции для управления бонусной системой
  const loadBonusSettings = async () => {
    try {
      const response = await fetch('/api/admin/bonus-settings');
      if (response.ok) {
        const data = await response.json();
        setBonusSettings(data.bonusSettings[0] || null);
        setBonusGrids(data.bonusGrids || []);
        setBonusMotivations(data.bonusMotivations || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки настроек бонусов:", error);
    }
  };

  const saveBaseSettings = async () => {
    if (!bonusSettings) return;
    
    try {
      const response = await fetch('/api/admin/bonus-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'baseSettings',
          settings: bonusSettings,
        }),
      });
      
      if (response.ok) {
        await loadBonusSettings();
        alert('Базовые настройки сохранены');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка сохранения базовых настроек:", error);
      alert("Ошибка при сохранении настроек");
    }
  };

  const handleEditBonusGrid = (grid: BonusGrid) => {
    setEditingBonusGrid(grid);
    setShowBonusGridModal(true);
  };

  const handleDeleteBonusGrid = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту ступень бонусной сетки?')) return;
    
    try {
      const response = await fetch(`/api/admin/bonus-settings?type=bonusGrid&id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadBonusSettings();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления ступени сетки:", error);
      alert("Ошибка при удалении ступени");
    }
  };

  const handleEditMotivation = (motivation: BonusMotivation) => {
    setEditingMotivation(motivation);
    setShowMotivationModal(true);
  };

  const handleDeleteMotivation = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту мотивацию?')) return;
    
    try {
      const response = await fetch(`/api/admin/bonus-settings?type=bonusMotivation&id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadBonusSettings();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления мотивации:", error);
      alert("Ошибка при удалении мотивации");
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

  // Функция загрузки материалов обработки
  const loadProcessingMaterials = async () => {
    try {
      // Загружаем инструкции
      const instructionsResponse = await fetch('/api/admin/processing-instructions');
      if (instructionsResponse.ok) {
        const data = await instructionsResponse.json();
        setInstructions(data.instructions || []);
      }

      // Загружаем скрипты
      const scriptsResponse = await fetch('/api/admin/processing-scripts');
      if (scriptsResponse.ok) {
        const data = await scriptsResponse.json();
        setScripts(data.scripts || []);
      }

      // Загружаем ресурсы
      const resourcesResponse = await fetch('/api/admin/processing-resources');
      if (resourcesResponse.ok) {
        const data = await resourcesResponse.json();
        setResources(data.resources || []);
      }

      // Загружаем шаблоны
      const templatesResponse = await fetch('/api/admin/processing-templates');
      if (templatesResponse.ok) {
        const data = await templatesResponse.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки материалов:", error);
    }
  };

  // Функции для управления инструкциями
  const handleEditInstruction = (instruction: ProcessingInstruction) => {
    setEditingInstruction(instruction);
    setShowInstructionModal(true);
  };

  const handleDeleteInstruction = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту инструкцию?')) return;
    
    try {
      const response = await fetch(`/api/admin/processing-instructions?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadProcessingMaterials();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления инструкции:", error);
      alert("Ошибка при удалении инструкции");
    }
  };

  // Функции для управления скриптами
  const handleEditScript = (script: ProcessingScript) => {
    setEditingScript(script);
    setShowScriptModal(true);
  };

  const handleDeleteScript = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот скрипт?')) return;
    
    try {
      const response = await fetch(`/api/admin/processing-scripts?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadProcessingMaterials();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления скрипта:", error);
      alert("Ошибка при удалении скрипта");
    }
  };

  // Функции для управления ресурсами
  const handleEditResource = (resource: ProcessingResource) => {
    setEditingResource(resource);
    setShowResourceModal(true);
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот ресурс?')) return;
    
    try {
      const response = await fetch(`/api/admin/processing-resources?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadProcessingMaterials();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления ресурса:", error);
      alert("Ошибка при удалении ресурса");
    }
  };

  // Функции для управления шаблонами
  const handleEditTemplate = (template: ProcessingTemplate) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;
    
    try {
      const response = await fetch(`/api/admin/processing-templates?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadProcessingMaterials();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Ошибка удаления шаблона:", error);
      alert("Ошибка при удалении шаблона");
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
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Система</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Автоодобрение:</span>
                  <span>Включено</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Бонусы:</span>
                  <span>Начисляются сразу</span>
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
                onClick={() => setActiveTab("managers")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "managers"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Менеджеры
              </button>
              <button
                onClick={() => setActiveTab("materials")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "materials"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Инструкции и скрипты
              </button>
              <button
                onClick={() => setActiveTab("bonusGrid")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bonusGrid"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Бонусная сетка
              </button>
              <button
                onClick={() => setActiveTab("salaryRequests")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "salaryRequests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Запросы ЗП
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
                          Заметки
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Действия
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
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                            {deposit.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    Настройки бонусов и комиссий
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowBonusGridModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Добавить ступень сетки
                    </button>
                    <button 
                      onClick={() => setShowMotivationModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Добавить мотивацию
                    </button>
                  </div>
                </div>

                {/* Базовые настройки */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Базовые настройки</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Базовая комиссия (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={bonusSettings?.baseCommissionRate || 30.0}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white dark:bg-gray-800 dark:border-blue-700 dark:text-white"
                        onChange={(e) => setBonusSettings(prev => prev ? { ...prev, baseCommissionRate: parseFloat(e.target.value) || 0 } : null)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Базовый бонус (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={bonusSettings?.baseBonusRate || 5.0}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white dark:bg-gray-800 dark:border-blue-700 dark:text-white"
                        onChange={(e) => setBonusSettings(prev => prev ? { ...prev, baseBonusRate: parseFloat(e.target.value) || 0 } : null)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={saveBaseSettings}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </div>

                {/* Бонусная сетка */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Бонусная сетка</h4>
                  <div className="space-y-3">
                    {bonusGrids.map((grid) => (
                      <div key={grid.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            ${grid.minAmount.toLocaleString()} - {grid.maxAmount ? `$${grid.maxAmount.toLocaleString()}` : '∞'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{grid.description}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-green-600">{grid.bonusPercentage}%</span>
                          <button
                            onClick={() => handleEditBonusGrid(grid)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteBonusGrid(grid.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {bonusGrids.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Бонусная сетка не настроена
                      </div>
                    )}
                  </div>
                </div>

                {/* Мотивации */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Дополнительные мотивации</h4>
                  <div className="space-y-3">
                    {bonusMotivations.map((motivation) => (
                      <div key={motivation.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{motivation.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{motivation.description}</div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            {motivation.type === 'PERCENTAGE' ? `${motivation.value}%` : `$${motivation.value}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            motivation.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {motivation.isActive ? 'Активно' : 'Неактивно'}
                          </span>
                          <button
                            onClick={() => handleEditMotivation(motivation)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteMotivation(motivation.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {bonusMotivations.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Мотивации не настроены
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "managers" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    Управление менеджерами
                  </h3>
                  <button 
                    onClick={() => setShowManagerModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Добавить менеджера
                  </button>
                </div>

                {/* Фильтры и поиск */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Поиск</label>
                      <input
                        type="text"
                        placeholder="Имя, email..."
                        value={managerFilters.search}
                        onChange={(e) => setManagerFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                      <select
                        value={managerFilters.status}
                        onChange={(e) => setManagerFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="all">Все</option>
                        <option value="active">Активные</option>
                        <option value="blocked">Заблокированные</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сортировка</label>
                      <select
                        value={managerFilters.sortBy}
                        onChange={(e) => setManagerFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="name">По имени</option>
                        <option value="performance">По эффективности</option>
                        <option value="earnings">По заработку</option>
                        <option value="createdAt">По дате регистрации</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Список менеджеров */}
                <div className="space-y-4">
                  {managers.map((manager) => (
                    <div key={manager.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                {manager.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {manager.name}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400">{manager.email}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                Зарегистрирован: {new Date(manager.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Статистика менеджера */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{manager.stats.totalDeposits}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Депозитов</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">${manager.stats.totalAmount.toLocaleString()}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Общий объем</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">${manager.stats.totalBonuses.toLocaleString()}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Заработано</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">{manager.stats.avgBonusRate}%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Средний бонус</div>
                            </div>
                          </div>

                          {/* Текущие настройки */}
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Текущие настройки</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Базовая ставка:</span>
                                <span className="ml-2 font-medium">{manager.settings.baseRate}%</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Доп. процент:</span>
                                <span className="ml-2 font-medium">{manager.settings.bonusPercentage}%</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Фикс. бонус:</span>
                                <span className="ml-2 font-medium">${manager.settings.fixedBonus}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                  manager.isBlocked 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {manager.isBlocked ? 'Заблокирован' : 'Активен'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Действия */}
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleEditManager(manager)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleManagerSalary(manager)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Управление ЗП"
                          >
                            💰
                          </button>
                          <button
                            onClick={() => handleManagerBonuses(manager)}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-2 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            title="Управление бонусами"
                          >
                            🎁
                          </button>
                          <button
                            onClick={() => handleManagerStats(manager)}
                            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 p-2 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            title="Детальная статистика"
                          >
                            📊
                          </button>
                          <button
                            onClick={() => handleToggleManagerStatus(manager)}
                            className={`p-2 rounded ${
                              manager.isBlocked
                                ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                            title={manager.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                          >
                            {manager.isBlocked ? '✅' : '🚫'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {managers.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет менеджеров</h3>
                      <p className="text-gray-500 dark:text-gray-400">Пользователи с ролью PROCESSOR появятся здесь автоматически</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "materials" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    Управление инструкциями и скриптами
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowInstructionModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Добавить инструкцию
                    </button>
                    <button 
                      onClick={() => setShowScriptModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Добавить скрипт
                    </button>
                    <button 
                      onClick={() => setShowResourceModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Добавить ресурс
                    </button>
                    <button 
                      onClick={() => setShowTemplateModal(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Добавить шаблон
                    </button>
                  </div>
                </div>

                {/* Статистика материалов */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Инструкции</h4>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {instructions.length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {instructions.filter(i => i.isActive).length} активных
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">Скрипты</h4>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {scripts.length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {scripts.filter(s => s.isActive).length} активных
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">Ресурсы</h4>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {resources.length}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      {resources.filter(r => r.isActive).length} активных
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">Шаблоны</h4>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {templates.length}
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      {templates.filter(t => t.isActive).length} активных
                    </div>
                  </div>
                </div>

                {/* Инструкции */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Инструкции</h4>
                  <div className="space-y-3">
                    {instructions.map((instruction) => (
                      <div key={instruction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              instruction.category === 'rules' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              instruction.category === 'faq' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {instruction.category === 'rules' ? 'Правила' : 
                               instruction.category === 'faq' ? 'FAQ' : 'Советы'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              instruction.priority >= 4 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              instruction.priority >= 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              Приоритет {instruction.priority}
                            </span>
                          </div>
                          <div className="font-medium mt-1">{instruction.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {instruction.content.substring(0, 100)}...
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            instruction.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {instruction.isActive ? 'Активно' : 'Неактивно'}
                          </span>
                          <button
                            onClick={() => handleEditInstruction(instruction)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteInstruction(instruction.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {instructions.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Инструкции не созданы
                      </div>
                    )}
                  </div>
                </div>

                {/* Скрипты */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Скрипты</h4>
                  <div className="space-y-3">
                    {scripts.map((script) => (
                      <div key={script.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              script.category === 'greeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              script.category === 'clarification' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              script.category === 'confirmation' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {script.category === 'greeting' ? 'Приветствие' : 
                               script.category === 'clarification' ? 'Уточнение' :
                               script.category === 'confirmation' ? 'Подтверждение' : 'Поддержка'}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                              {script.language.toUpperCase()}
                            </span>
                          </div>
                          <div className="font-medium mt-1">{script.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {script.description || script.content.substring(0, 100)}...
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            script.isActive 
                              ? 'bg-green-100 text-green-800 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {script.isActive ? 'Активно' : 'Неактивно'}
                          </span>
                          <button
                            onClick={() => handleEditScript(script)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteScript(script.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {scripts.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Скрипты не созданы
                      </div>
                    )}
                  </div>
                </div>

                {/* Ресурсы */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ресурсы</h4>
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              resource.type === 'link' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              resource.type === 'video' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              resource.type === 'document' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {resource.type === 'link' ? 'Ссылка' : 
                               resource.type === 'video' ? 'Видео' :
                               resource.type === 'document' ? 'Документ' : 'Файл'}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                              Порядок: {resource.order}
                            </span>
                          </div>
                          <div className="font-medium mt-1">{resource.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {resource.description || resource.url || resource.filePath}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            resource.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {resource.isActive ? 'Активно' : 'Неактивно'}
                          </span>
                          <button
                            onClick={() => handleEditResource(resource)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {resources.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Ресурсы не созданы
                      </div>
                    )}
                  </div>
                </div>

                {/* Шаблоны */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Шаблоны</h4>
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              template.type === 'email' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              template.type === 'message' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {template.type === 'email' ? 'Email' : 
                               template.type === 'message' ? 'Сообщение' : 'Уведомление'}
                            </span>
                          </div>
                          <div className="font-medium mt-1">{template.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {template.description || template.content.substring(0, 100)}...
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            template.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {template.isActive ? 'Активно' : 'Неактивно'}
                          </span>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Шаблоны не созданы
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bonusGrid" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                    Настройка бонусной сетки для пользователей
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Настройте, как будет выглядеть страница &quot;Бонусная сетка и условия работы&quot; для пользователей
                  </p>
                </div>

                {/* Основные настройки страницы */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                    Основные настройки страницы
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Заголовок страницы
                      </label>
                      <input
                        type="text"
                        defaultValue="Бонусная сетка и условия работы"
                        className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white dark:bg-gray-800 dark:border-blue-700 dark:text-white"
                        placeholder="Заголовок страницы бонусов"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Подзаголовок
                      </label>
                      <input
                        type="text"
                        defaultValue="Узнайте, как рассчитываются бонусы и комиссии за ваши депозиты"
                        className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white dark:bg-gray-800 dark:border-blue-700 dark:text-white"
                        placeholder="Описание страницы"
                      />
                    </div>
                  </div>
                </div>

                {/* Базовая комиссия */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
                    Базовая комиссия и бонусы
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                        Комиссия платформы (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={bonusSettings?.baseCommissionRate || 30.0}
                        className="w-full px-3 py-2 border border-green-200 rounded-md bg-white dark:bg-gray-800 dark:border-green-700 dark:text-white"
                        onChange={(e) => setBonusSettings(prev => prev ? { ...prev, baseCommissionRate: parseFloat(e.target.value) || 0 } : null)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                        Базовый бонус (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={bonusSettings?.baseBonusRate || 5.0}
                        className="w-full px-3 py-2 border border-green-200 rounded-md bg-white dark:bg-gray-800 dark:border-green-700 dark:text-white"
                        onChange={(e) => setBonusSettings(prev => prev ? { ...prev, baseBonusRate: parseFloat(e.target.value) || 0 } : null)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={saveBaseSettings}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </div>

                {/* Бонусная сетка */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                      Прогрессивная сетка бонусов
                    </h4>
                    <button 
                      onClick={() => setShowBonusGridModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Добавить ступень
                    </button>
                  </div>
                  <div className="space-y-3">
                    {bonusGrids.map((grid) => (
                      <div key={grid.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            ${grid.minAmount.toLocaleString()} - {grid.maxAmount ? `$${grid.maxAmount.toLocaleString()}` : '∞'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{grid.description}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-purple-600">{grid.bonusPercentage}%</span>
                          <button
                            onClick={() => handleEditBonusGrid(grid)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteBonusGrid(grid.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {bonusGrids.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Бонусная сетка не настроена. Добавьте первую ступень для начала.
                      </div>
                    )}
                  </div>
                </div>

                {/* Дополнительные мотивации */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                      Дополнительные мотивации
                    </h4>
                    <button 
                      onClick={() => setShowMotivationModal(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Добавить мотивацию
                    </button>
                  </div>
                  <div className="space-y-3">
                    {bonusMotivations.map((motivation) => (
                      <div key={motivation.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{motivation.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{motivation.description}</div>
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            {motivation.type === 'PERCENTAGE' ? `${motivation.value}%` : `$${motivation.value}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            motivation.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {motivation.isActive ? 'Активно' : 'Неактивно'}
                          </span>
                          <button
                            onClick={() => handleEditMotivation(motivation)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteMotivation(motivation.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {bonusMotivations.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Мотивации не настроены. Добавьте первую мотивацию для начала.
                      </div>
                    )}
                  </div>
                </div>

                {/* Примеры расчета */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
                    Примеры расчета бонусов
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="font-medium mb-2">Депозит $100 (первый за день)</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Бонус: $100 × 5% = $5.00
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="font-medium mb-2">Депозит $500 (сумма за день $600)</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Бонус: $500 × 5% = $25.00 (базовая ставка)
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="font-medium mb-2">Депозит $1000 (сумма за день $2000)</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Бонус: $1000 × 7.5% = $75.00 (повышенная ставка)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Предварительный просмотр */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Предварительный просмотр страницы
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Бонусная сетка и условия работы
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Узнайте, как рассчитываются бонусы и комиссии за ваши депозиты
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="text-lg font-bold text-blue-600">{bonusSettings?.baseCommissionRate || 30}%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Комиссия платформы</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="text-lg font-bold text-green-600">{bonusSettings?.baseBonusRate || 5}%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Базовый бонус</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {bonusGrids.slice(0, 3).map((grid, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm">Дневная сумма ${grid.minAmount.toLocaleString()} - {grid.maxAmount ? `$${grid.maxAmount.toLocaleString()}` : '∞'}</span>
                          <span className="text-sm font-semibold text-green-600">{grid.bonusPercentage}% бонус</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "salaryRequests" && (
              <SalaryRequestsTab />
            )}
          </div>
        </div>
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

      {/* Модальные окна для бонусной системы */}
      
      {/* Модальное окно бонусной сетки */}
      {showBonusGridModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingBonusGrid ? 'Редактировать ступень' : 'Добавить ступень сетки'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                minAmount: parseFloat(formData.get('minAmount') as string),
                maxAmount: formData.get('maxAmount') ? parseFloat(formData.get('maxAmount') as string) : null,
                bonusPercentage: parseFloat(formData.get('bonusPercentage') as string),
                description: formData.get('description') as string,
              };

              try {
                const response = await fetch('/api/admin/bonus-settings', {
                  method: editingBonusGrid ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'bonusGrid',
                    ...(editingBonusGrid && { id: editingBonusGrid.id }),
                    ...(editingBonusGrid && { updates: data }),
                    ...(!editingBonusGrid && { settings: data }),
                  }),
                });

                if (response.ok) {
                  await loadBonusSettings();
                  setShowBonusGridModal(false);
                  setEditingBonusGrid(null);
                } else {
                  const error = await response.json();
                  alert(`Ошибка: ${error.error}`);
                }
              } catch (error) {
                console.error("Ошибка сохранения ступени сетки:", error);
                alert("Ошибка при сохранении");
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Минимальная сумма ($)</label>
                  <input
                    type="number"
                    name="minAmount"
                    step="0.01"
                    defaultValue={editingBonusGrid?.minAmount || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Максимальная сумма ($) - необязательно</label>
                  <input
                    type="number"
                    name="maxAmount"
                    step="0.01"
                    defaultValue={editingBonusGrid?.maxAmount || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Оставьте пустым для ∞"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Процент бонуса (%)</label>
                  <input
                    type="number"
                    name="bonusPercentage"
                    step="0.1"
                    defaultValue={editingBonusGrid?.bonusPercentage || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={editingBonusGrid?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Например: Высокий объем"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowBonusGridModal(false);
                    setEditingBonusGrid(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                >
                  {editingBonusGrid ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно мотиваций */}
      {showMotivationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingMotivation ? 'Редактировать мотивацию' : 'Добавить мотивацию'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                type: formData.get('type') as 'PERCENTAGE' | 'FIXED_AMOUNT',
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                value: parseFloat(formData.get('value') as string),
                conditions: formData.get('conditions') as string,
                isActive: formData.get('isActive') === 'true',
              };

              try {
                const response = await fetch('/api/admin/bonus-settings', {
                  method: editingMotivation ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'bonusMotivation',
                    ...(editingMotivation && { id: editingMotivation.id }),
                    ...(editingMotivation && { updates: data }),
                    ...(!editingMotivation && { settings: data }),
                  }),
                });

                if (response.ok) {
                  await loadBonusSettings();
                  setShowMotivationModal(false);
                  setEditingMotivation(null);
                } else {
                  const error = await response.json();
                  alert(`Ошибка: ${error.error}`);
                }
              } catch (error) {
                console.error("Ошибка сохранения мотивации:", error);
                alert("Ошибка при сохранении");
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип мотивации</label>
                  <select
                    name="type"
                    defaultValue={editingMotivation?.type || 'PERCENTAGE'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="PERCENTAGE">Процент от суммы</option>
                    <option value="FIXED_AMOUNT">Фиксированная сумма</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMotivation?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Например: Бонус за 100 депозитов"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                  <textarea
                    name="description"
                    defaultValue={editingMotivation?.description || ''}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Подробное описание условий"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {editingMotivation?.type === 'FIXED_AMOUNT' ? 'Сумма ($)' : 'Процент (%)'}
                  </label>
                  <input
                    type="number"
                    name="value"
                    step="0.01"
                    defaultValue={editingMotivation?.value || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Условия (JSON)</label>
                  <textarea
                    name="conditions"
                    defaultValue={editingMotivation?.conditions || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder='{"minDeposits": 100, "minAmount": 5000}'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                  <select
                    name="isActive"
                    defaultValue={editingMotivation?.isActive?.toString() || 'true'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="true">Активно</option>
                    <option value="false">Неактивно</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMotivationModal(false);
                    setEditingMotivation(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
                >
                  {editingMotivation ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
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

      {/* Модальные окна для управления материалами */}
      
      {/* Модальное окно инструкции */}
      {showInstructionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingInstruction ? 'Редактировать инструкцию' : 'Добавить инструкцию'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                category: formData.get('category') as string,
                priority: parseInt(formData.get('priority') as string),
                isActive: formData.get('isActive') === 'true',
                isPublic: formData.get('isPublic') === 'true',
                targetRoles: formData.get('targetRoles') ? JSON.parse(formData.get('targetRoles') as string) : null
              };

              try {
                const response = await fetch('/api/admin/processing-instructions', {
                  method: editingInstruction ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingInstruction ? { id: editingInstruction.id, ...data } : data),
                });

                if (response.ok) {
                  await loadProcessingMaterials();
                  setShowInstructionModal(false);
                  setEditingInstruction(null);
                } else {
                  const error = await response.json();
                  alert(`Ошибка: ${error.error}`);
                }
              } catch (error) {
                console.error("Ошибка сохранения инструкции:", error);
                alert("Ошибка при сохранении");
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingInstruction?.title || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание</label>
                  <textarea
                    name="content"
                    defaultValue={editingInstruction?.content || ''}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
                    <select
                      name="category"
                      defaultValue={editingInstruction?.category || 'general'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="general">Общие</option>
                      <option value="rules">Правила</option>
                      <option value="faq">FAQ</option>
                      <option value="tips">Советы</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Приоритет</label>
                    <select
                      name="priority"
                      defaultValue={editingInstruction?.priority || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value={1}>1 - Низкий</option>
                      <option value={2}>2 - Средний</option>
                      <option value={3}>3 - Высокий</option>
                      <option value={4}>4 - Критический</option>
                      <option value={5}>5 - Максимальный</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                    <select
                      name="isActive"
                      defaultValue={editingInstruction?.isActive?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="true">Активно</option>
                      <option value="false">Неактивно</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Публичность</label>
                  <select
                    name="isPublic"
                    defaultValue={editingInstruction?.isPublic?.toString() || 'true'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="true">Публичная</option>
                    <option value="false">Приватная</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowInstructionModal(false);
                    setEditingInstruction(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  {editingInstruction ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно скрипта */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingScript ? 'Редактировать скрипт' : 'Добавить скрипт'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                description: formData.get('description') as string,
                category: formData.get('category') as string,
                language: formData.get('language') as string,
                isActive: formData.get('isActive') === 'true',
                isPublic: formData.get('isPublic') === 'true',
                targetRoles: formData.get('targetRoles') ? JSON.parse(formData.get('targetRoles') as string) : null
              };

              try {
                const response = await fetch('/api/admin/processing-scripts', {
                  method: editingScript ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingScript ? { id: editingScript.id, ...data } : data),
                });

                if (response.ok) {
                  await loadProcessingMaterials();
                  setShowScriptModal(false);
                  setEditingScript(null);
                } else {
                  const error = await response.json();
                  alert(`Ошибка: ${error.error}`);
                }
              } catch (error) {
                console.error("Ошибка сохранения скрипта:", error);
                alert("Ошибка при сохранении");
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingScript?.title || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                  <textarea
                    name="description"
                    defaultValue={editingScript?.description || ''}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Краткое описание назначения скрипта"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание</label>
                  <textarea
                    name="content"
                    defaultValue={editingScript?.content || ''}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
                    <select
                      name="category"
                      defaultValue={editingScript?.category || 'general'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="general">Общие</option>
                      <option value="greeting">Приветствие</option>
                      <option value="clarification">Уточнение</option>
                      <option value="confirmation">Подтверждение</option>
                      <option value="support">Поддержка</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Язык</label>
                    <select
                      name="language"
                      defaultValue={editingScript?.language || 'ru'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                    <select
                      name="isActive"
                      defaultValue={editingScript?.isActive?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="true">Активно</option>
                      <option value="false">Неактивно</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Публичность</label>
                  <select
                    name="isPublic"
                    defaultValue={editingScript?.isPublic?.toString() || 'true'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="true">Публичный</option>
                    <option value="false">Приватный</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowScriptModal(false);
                    setEditingScript(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                >
                  {editingScript ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно ресурса */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingResource ? 'Редактировать ресурс' : 'Добавить ресурс'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                type: formData.get('type') as string,
                url: formData.get('url') as string,
                filePath: formData.get('filePath') as string,
                category: formData.get('category') as string,
                isActive: formData.get('isActive') === 'true',
                isPublic: formData.get('isPublic') === 'true',
                order: parseInt(formData.get('order') as string),
                targetRoles: formData.get('targetRoles') ? JSON.parse(formData.get('targetRoles') as string) : null
              };

              try {
                const response = await fetch('/api/admin/processing-resources', {
                  method: editingResource ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingResource ? { id: editingResource.id, ...data } : data),
                });

                if (response.ok) {
                  await loadProcessingMaterials();
                  setShowResourceModal(false);
                  setEditingResource(null);
                } else {
                  const error = await response.json();
                  alert(`Ошибка: ${error.error}`);
                }
              } catch (error) {
                console.error("Ошибка сохранения ресурса:", error);
                alert("Ошибка при сохранении");
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingResource?.title || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                  <textarea
                    name="description"
                    defaultValue={editingResource?.description || ''}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип</label>
                    <select
                      name="type"
                      defaultValue={editingResource?.type || 'link'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="link">Ссылка</option>
                      <option value="video">Видео</option>
                      <option value="document">Документ</option>
                      <option value="file">Файл</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
                    <select
                      name="category"
                      defaultValue={editingResource?.category || 'general'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="general">Общие</option>
                      <option value="education">Обучение</option>
                      <option value="tutorial">Инструкции</option>
                      <option value="tools">Инструменты</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Порядок</label>
                    <input
                      type="number"
                      name="order"
                      defaultValue={editingResource?.order || 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                  <input
                    type="url"
                    name="url"
                    defaultValue={editingResource?.url || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Путь к файлу</label>
                  <input
                    type="text"
                    name="filePath"
                    defaultValue={editingResource?.filePath || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="/uploads/files/document.pdf"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                    <select
                      name="isActive"
                      defaultValue={editingResource?.isActive?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="true">Активно</option>
                      <option value="false">Неактивно</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Публичность</label>
                    <select
                      name="isPublic"
                      defaultValue={editingResource?.isPublic?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="true">Публичный</option>
                      <option value="false">Приватный</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowResourceModal(false);
                    setEditingResource(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
                >
                  {editingResource ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно шаблона */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingTemplate ? 'Редактировать шаблон' : 'Добавить шаблон'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                content: formData.get('content') as string,
                type: formData.get('type') as string,
                variables: formData.get('variables') ? JSON.parse(formData.get('variables') as string) : null,
                isActive: formData.get('isActive') === 'true',
                isPublic: formData.get('isPublic') === 'true',
                targetRoles: formData.get('targetRoles') ? JSON.parse(formData.get('targetRoles') as string) : null
              };

              try {
                const response = await fetch('/api/admin/processing-templates', {
                  method: editingTemplate ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingTemplate ? { id: editingTemplate.id, ...data } : data),
                });

                if (response.ok) {
                  await loadProcessingMaterials();
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                } else {
                  const error = await response.json();
                  alert(`Ошибка: ${error.error}`);
                }
              } catch (error) {
                console.error("Ошибка сохранения шаблона:", error);
                alert("Ошибка при сохранении");
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTemplate?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                  <textarea
                    name="description"
                    defaultValue={editingTemplate?.description || ''}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание</label>
                  <textarea
                    name="content"
                    defaultValue={editingTemplate?.content || ''}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип</label>
                    <select
                      name="type"
                      defaultValue={editingTemplate?.type || 'email'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="email">Email</option>
                      <option value="message">Сообщение</option>
                      <option value="notification">Уведомление</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Переменные (JSON)</label>
                    <input
                      type="text"
                      name="variables"
                      defaultValue={editingTemplate?.variables || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder='["СУММА", "ВАЛЮТА", "БОНУС"]'
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                    <select
                      name="isActive"
                      defaultValue={editingTemplate?.isActive?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="true">Активно</option>
                      <option value="false">Неактивно</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Публичность</label>
                    <select
                      name="isPublic"
                      defaultValue={editingTemplate?.isPublic?.toString() || 'true'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="true">Публичный</option>
                      <option value="false">Приватный</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
                >
                  {editingTemplate ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
