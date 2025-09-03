"use client";

import { useState, useEffect } from "react";
// import Link from "next/link"; // Не используется
import { Plus } from "lucide-react";
// import { Edit, Trash2 } from "lucide-react"; // Не используются
import ConfirmModal from "@/components/modals/ConfirmModal";
import FinanceEntityModal from "@/components/modals/FinanceEntityModal";

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
  const [activeTab, setActiveTab] = useState<'counterparties' | 'categories' | 'projects' | 'accounts'>('counterparties');
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);

  // Modal states
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEntity, setCurrentEntity] = useState<any>(null);
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
  const openCreateModal = (entityType: 'counterparty' | 'category' | 'project' | 'account') => {
    setCurrentEntity({ type: entityType });
    setModalMode('create');
    setEntityModalOpen(true);
  };

  const openEditModal = async (entityType: 'counterparty' | 'category' | 'project' | 'account', entity: any) => {
    try {
      let fullEntityData = entity;
      
      // Получаем полные данные с сервера для каждого типа сущности
      if (entityType === 'counterparty') {
        const response = await fetch(`/api/admin/finance/counterparties/${entity.id}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          fullEntityData = data.counterparty;
        }
      } else if (entityType === 'category') {
        const response = await fetch(`/api/admin/finance/categories/${entity.id}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          fullEntityData = data.category;
        }
      } else if (entityType === 'project') {
        const response = await fetch(`/api/admin/finance/projects/${entity.id}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          fullEntityData = data.project;
        }
      } else if (entityType === 'account') {
        const response = await fetch(`/api/admin/finance/accounts/${entity.id}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          fullEntityData = data.account || data; // API может вернуть данные напрямую
        }
      }
      
      setCurrentEntity({ ...fullEntityData, type: entityType });
      setModalMode('edit');
      setEntityModalOpen(true);
    } catch (error) {
      console.error('Ошибка при получении данных для редактирования:', error);
      // В случае ошибки используем данные из списка
      setCurrentEntity({ ...entity, type: entityType });
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

    // Определяем правильный ключ для получения названия типа сущности
    const entityTypeKey = activeTab === 'counterparties' ? 'counterparty' : 
                         activeTab === 'categories' ? 'category' :
                         activeTab === 'projects' ? 'project' :
                         activeTab === 'accounts' ? 'account' : 'unknown';

    setEntityToDelete({
      id: entity.id,
      name: entity.description || entity.name,
      type: entityNames[entityTypeKey as keyof typeof entityNames] || 'элемент'
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





  const handleDeleteEntity = async () => {
    if (!entityToDelete) return;

    // Определяем правильный тип сущности и endpoint
    const entityTypeKey = activeTab === 'counterparties' ? 'counterparty' : 
                         activeTab === 'categories' ? 'category' :
                         activeTab === 'projects' ? 'project' :
                         activeTab === 'accounts' ? 'account' : 'unknown';
    
    const endpointMap = {
      'counterparty': 'counterparties',
      'category': 'categories', 
      'project': 'projects',
      'account': 'accounts'
    };

    const endpoint = `/api/admin/finance/${endpointMap[entityTypeKey as keyof typeof endpointMap]}/${entityToDelete.id}`;

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




    </div>
  );
}

export default function FinanceSettingsPage() {
  return <FinanceSettingsContent />;
}
