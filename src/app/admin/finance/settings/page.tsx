"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit, Trash2, Plus } from "lucide-react";
import ConfirmModal from "@/components/modals/ConfirmModal";
import FinanceEntityModal from "@/components/modals/FinanceEntityModal";
import DepositSourceModal from "@/components/modals/DepositSourceModal";

import FinanceEntityList from "@/components/FinanceEntityList";

interface Counterparty {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  bankDetails: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  description: string | null;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  commission: number;
  cryptocurrencies?: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

function FinanceSettingsContent() {
  const [activeTab, setActiveTab] = useState<'counterparties' | 'categories' | 'projects' | 'accounts' | 'deposits'>('counterparties');
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [depositSources, setDepositSources] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [depositStats, setDepositStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [depositSourceModalOpen, setDepositSourceModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEntity, setCurrentEntity] = useState<any>(null);
  const [currentDepositSource, setCurrentDepositSource] = useState<any>(null);
  const [entityToDelete, setEntityToDelete] = useState<{id: string, name: string, type: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'counterparties':
          const counterpartiesResponse = await fetch('/api/admin/finance/counterparties');
          if (counterpartiesResponse.ok) {
            const data = await counterpartiesResponse.json();
            setCounterparties(data.counterparties || []);
          }
          break;
        case 'categories':
          const categoriesResponse = await fetch('/api/admin/finance/categories');
          if (categoriesResponse.ok) {
            const data = await categoriesResponse.json();
            setCategories(data.categories || []);
          }
          break;
        case 'projects':
          const projectsResponse = await fetch('/api/admin/finance/projects');
          if (projectsResponse.ok) {
            const data = await projectsResponse.json();
            setProjects(data.projects || []);
          }
          break;
        case 'accounts':
          const accountsResponse = await fetch('/api/admin/finance/accounts');
          if (accountsResponse.ok) {
            const data = await accountsResponse.json();
            setAccounts(data.accounts || []);
          }
          break;

        case 'deposits':
          // Загружаем источники депозитов и последние депозиты
          const [sourcesResponse, depositsResponse] = await Promise.all([
            fetch('/api/admin/finance/deposit-sources'),
            fetch('/api/admin/finance/deposits?limit=20')
          ]);

          if (sourcesResponse.ok) {
            const sourcesData = await sourcesResponse.json();
            setDepositSources(sourcesData.depositSources || []);
          }

          if (depositsResponse.ok) {
            const depositsData = await depositsResponse.json();
            setDeposits(depositsData.deposits || []);
            setDepositStats(depositsData.stats || null);
          }
          break;
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string, entityType: string) => {
    const labels: Record<string, Record<string, string>> = {
      counterparty: {
        'CLIENT': 'Клиент',
        'SUPPLIER': 'Поставщик',
        'PARTNER': 'Партнер',
        'EMPLOYEE': 'Сотрудник',
      },
      category: {
        'INCOME': 'Доход',
        'EXPENSE': 'Расход',
      },
      project: {
        'ACTIVE': 'Активный',
        'COMPLETED': 'Завершен',
        'ON_HOLD': 'На паузе',
        'CANCELLED': 'Отменен',
      },
      account: {
        'BANK': 'Банковский счет',
        'CASH': 'Наличные',
        'CREDIT': 'Кредитная карта',
        'CRYPTO_WALLET': 'Криптокошелек',
        'CRYPTO_EXCHANGE': 'Криптобиржа',
        'OTHER': 'Другое',
      }
    };
    return labels[entityType]?.[type] || type;
  };

  const getTypeColor = (type: string, entityType: string) => {
    const colors: Record<string, Record<string, string>> = {
      counterparty: {
        'CLIENT': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'SUPPLIER': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        'PARTNER': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        'EMPLOYEE': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      },
      category: {
        'INCOME': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'EXPENSE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
      project: {
        'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'COMPLETED': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        'ON_HOLD': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
      account: {
        'BANK': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        'CASH': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'CREDIT': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        'CRYPTO_WALLET': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        'CRYPTO_EXCHANGE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        'OTHER': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      }
    };
    return colors[entityType]?.[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Modal functions
  const openCreateModal = (entityType: 'counterparty' | 'category' | 'project' | 'account' | 'deposit-source') => {
    if (entityType === 'deposit-source') {
      setCurrentDepositSource(null);
      setDepositSourceModalOpen(true);
    } else {
      setCurrentEntity({ type: entityType });
      setModalMode('create');
      setEntityModalOpen(true);
    }
  };

  const openEditModal = (entityType: 'counterparty' | 'category' | 'project' | 'account' | 'deposit-source', entity: any) => {
    if (entityType === 'deposit-source') {
      setCurrentDepositSource(entity);
      setDepositSourceModalOpen(true);
    } else {
      setCurrentEntity(entity);
      setModalMode('edit');
      setEntityModalOpen(true);
    }
  };

  const openDeleteModal = (entity: any) => {
    const entityNames = {
      counterparty: 'контрагента',
      category: 'статью',
      project: 'проект',
      account: 'счет',
      'deposit-source': 'источник депозитов'
    };

    setEntityToDelete({
      id: entity.id,
      name: entity.description || entity.name,
      type: entityNames[activeTab.slice(0, -1) as keyof typeof entityNames] || 'элемент'
    });
    setConfirmModalOpen(true);
  };



  // API functions
  const handleSaveEntity = async (data: any) => {
    const entityType = currentEntity.type || activeTab.slice(0, -1);
    const endpoint = `/api/admin/finance/${entityType === 'counterparty' ? 'counterparties' : entityType === 'category' ? 'categories' : entityType === 'project' ? 'projects' : 'accounts'}`;

    try {
      let response;
      if (modalMode === 'create') {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch(`${endpoint}/${currentEntity.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        await fetchData(); // Перезагружаем данные
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
  };

  const handleSaveDepositSource = async (data: any) => {
    const endpoint = '/api/admin/finance/deposit-sources';

    try {
      let response;
      if (currentDepositSource) {
        // Редактирование
        response = await fetch(`${endpoint}/${currentDepositSource.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
      } else {
        // Создание
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        await fetchData(); // Перезагружаем данные
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения источника депозитов');
      }
    } catch (error) {
      console.error('Ошибка сохранения источника депозитов:', error);
      throw error;
    }
  };



  const handleDeleteEntity = async () => {
    if (!entityToDelete) return;

    const entityType = activeTab.slice(0, -1);
    let endpoint = '';

    if (entityType === 'deposit-source') {
      endpoint = `/api/admin/finance/deposit-sources/${entityToDelete.id}`;
    } else {
      endpoint = `/api/admin/finance/${entityType === 'counterparty' ? 'counterparties' : entityType === 'category' ? 'categories' : entityType === 'project' ? 'projects' : 'accounts'}/${entityToDelete.id}`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchData(); // Перезагружаем данные
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Настройки финансов
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Управление контрагентами, статьями, проектами и счетами
          </p>
        </div>
        <div className="text-sm text-[#171717]/40 dark:text-[#ededed]/40">
          Обновлено: {typeof window !== 'undefined' ? new Date().toLocaleString('ru-RU') : 'Загрузка...'}
        </div>
      </div>

      {/* Табы */}
      <div className="border-b border-[#171717]/10 dark:border-[#ededed]/10 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'counterparties', label: 'Контрагенты' },
            { id: 'categories', label: 'Статьи' },
            { id: 'projects', label: 'Проекты' },
            { id: 'accounts', label: 'Счета' },
            { id: 'deposits', label: 'Депозиты' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#2563eb] text-[#2563eb] dark:text-[#60a5fa]'
                  : 'border-transparent text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:border-[#171717]/20 dark:hover:border-[#ededed]/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Контрагенты */}
      {activeTab === 'counterparties' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
              Контрагенты
            </h2>
            <button
              onClick={() => openCreateModal('counterparty')}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить контрагента
            </button>
          </div>

          {counterparties.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20a3 3 0 01-3-3V7a3 3 0 116 0v10a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Контрагенты не найдены
              </h3>
              <p className="text-[#171717]/60 dark:text-[#ededed]/60 mb-6">
                Создайте первого контрагента для начала работы
              </p>
              <button
                onClick={() => openCreateModal('counterparty')}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить контрагента
              </button>
            </div>
          ) : (
            <FinanceEntityList
              entities={counterparties}
              entityType="counterparty"
              onEdit={(entity) => openEditModal('counterparty', entity)}
              onDelete={openDeleteModal}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
            />
          )}
        </div>
      )}

      {/* Категории */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
              Статьи
            </h2>
            <button
              onClick={() => openCreateModal('category')}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить статью
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Статьи не найдены
              </h3>
              <p className="text-[#171717]/60 dark:text-[#ededed]/60 mb-6">
                Создайте первые статьи для доходов и расходов
              </p>
              <button
                onClick={() => openCreateModal('category')}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить статью
              </button>
            </div>
          ) : (
            <FinanceEntityList
              entities={categories}
              entityType="category"
              onEdit={(entity) => openEditModal('category', entity)}
              onDelete={openDeleteModal}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
            />
          )}
        </div>
      )}

      {/* Проекты */}
      {activeTab === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
              Проекты
            </h2>
            <button
              onClick={() => openCreateModal('project')}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить проект
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Проекты не найдены
              </h3>
              <p className="text-[#171717]/60 dark:text-[#ededed]/60 mb-6">
                Создайте первый проект для отслеживания финансов
              </p>
              <button
                onClick={() => openCreateModal('project')}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить проект
              </button>
            </div>
          ) : (
            <FinanceEntityList
              entities={projects}
              entityType="project"
              onEdit={(entity) => openEditModal('project', entity)}
              onDelete={openDeleteModal}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}
        </div>
      )}

      {/* Счета */}
      {activeTab === 'accounts' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
              Счета
            </h2>
            <button
              onClick={() => openCreateModal('account')}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить счет
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 0h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v11.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Счета не найдены
              </h3>
              <p className="text-[#171717]/60 dark:text-[#ededed]/60 mb-6">
                Создайте первый счет для управления финансами
              </p>
              <button
                onClick={() => openCreateModal('account')}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить счет
              </button>
            </div>
          ) : (
            <FinanceEntityList
              entities={accounts}
              entityType="account"
              onEdit={(entity) => openEditModal('account', entity)}
              onDelete={openDeleteModal}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      )}



      {/* Депозиты */}
      {activeTab === 'deposits' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
              Депозиты
            </h2>
            <button
              onClick={() => openCreateModal('deposit-source')}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить источник
            </button>
          </div>

          {/* Источники депозитов */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
              Источники депозитов
            </h3>

            {depositSources.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
                <div className="w-12 h-12 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h4 className="text-base font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Источники депозитов не найдены
                </h4>
                <p className="text-[#171717]/60 dark:text-[#ededed]/60 mb-4">
                  Создайте первый источник для приема депозитов
                </p>
                <button
                  onClick={() => openCreateModal('deposit-source')}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить источник
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {depositSources.map((source: any) => (
                  <div
                    key={source.id}
                    className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-base font-semibold text-[#171717] dark:text-[#ededed] truncate">
                              {source.name}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              source.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {source.isActive ? 'Активен' : 'Отключен'}
                            </span>
                          </div>

                          <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 truncate">
                            Проект: {source.project?.name || 'Не указан'} • Комиссия: {source.commission}% • Депозитов: {source._count?.deposits || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditModal('deposit-source', source)}
                          className="p-2 text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb]/10 dark:hover:bg-[#60a5fa]/10 rounded-md transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(source)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Статистика депозитов */}
          {depositStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Всего депозитов</p>
                    <p className="text-xl font-bold text-[#171717] dark:text-[#ededed]">{depositStats.totalDeposits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Общая комиссия</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(depositStats.totalCommissionUsd, 'USD')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Чистая сумма</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(depositStats.totalNetAmountUsd, 'USD')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Грязная сумма</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(depositStats.totalAmountUsd, 'USD')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Список депозитов */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Последние депозиты
              </h3>
              <button
                onClick={() => fetchData()} // Перезагрузить данные
                className="text-[#2563eb] dark:text-[#60a5fa] hover:underline text-sm"
              >
                Обновить
              </button>
            </div>

            {deposits.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
                <div className="w-12 h-12 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h4 className="text-base font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Депозиты не найдены
                </h4>
                <p className="text-[#171717]/60 dark:text-[#ededed]/60">
                  Здесь будут отображаться поступившие депозиты
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((deposit: any) => (
                  <div
                    key={deposit.id}
                    className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-base font-semibold text-[#171717] dark:text-[#ededed] truncate">
                              {deposit.mammothLogin}
                            </h4>
                            <span className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">
                              {deposit.mammothCountry}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              deposit.processed
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {deposit.processed ? 'Обработан' : 'Новый'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* Грязная сумма */}
                            <div className="flex items-center gap-4 text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                              <span className="text-red-500 dark:text-red-400">
                                💰 {formatCurrency(deposit.amount, deposit.token)} ({deposit.token.toUpperCase()})
                              </span>
                              <span className="text-red-500 dark:text-red-400">
                                {formatCurrency(deposit.amountUsd, 'USD')}
                              </span>
                              <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded text-xs">
                                -{deposit.commissionPercent}% комиссия
                              </span>
                            </div>

                            {/* Чистая сумма */}
                            <div className="flex items-center gap-4 text-sm text-[#171717] dark:text-[#ededed] font-medium">
                              <span className="text-green-600 dark:text-green-400">
                                ✅ {formatCurrency(deposit.netAmount, deposit.token)} ({deposit.token.toUpperCase()})
                              </span>
                              <span className="text-green-600 dark:text-green-400">
                                {formatCurrency(deposit.netAmountUsd, 'USD')}
                              </span>
                              <span>
                                Проект: {deposit.depositSource?.project?.name || 'Не указан'}
                              </span>
                              <span>
                                {new Date(deposit.createdAt).toLocaleString('ru-RU')}
                              </span>
                            </div>

                            {/* Детали комиссии */}
                            <div className="text-xs text-[#171717]/50 dark:text-[#ededed]/50">
                              Комиссия: {formatCurrency(deposit.commissionAmount, deposit.token)} ({formatCurrency(deposit.commissionAmountUsd, 'USD')})
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            // Здесь можно добавить обработку депозита
                            console.log('Обработать депозит:', deposit.id);
                          }}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                          title="Обработать"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальные окна */}
      <FinanceEntityModal
        isOpen={entityModalOpen}
        onClose={() => setEntityModalOpen(false)}
        onSave={handleSaveEntity}
        entityType={currentEntity?.type || activeTab.slice(0, -1) as any}
        mode={modalMode}
        initialData={modalMode === 'edit' ? currentEntity : undefined}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleDeleteEntity}
        title={`Удалить ${entityToDelete?.type}?`}
        message={`Вы уверены, что хотите удалить ${entityToDelete?.type} "${entityToDelete?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        type="danger"
        actionType="delete"
      />

      <DepositSourceModal
        isOpen={depositSourceModalOpen}
        onClose={() => setDepositSourceModalOpen(false)}
        onSave={handleSaveDepositSource}
        mode={currentDepositSource ? 'edit' : 'create'}
        initialData={currentDepositSource}
      />


    </div>
  );
}

export default function FinanceSettingsPage() {
  return <FinanceSettingsContent />;
}
