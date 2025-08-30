"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

interface ProjectWithStats {
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
  income: number;
  expenses: number;
  netProfit: number;
  budgetUtilization: number;
  transactionCount: number;
  counterparties: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  counterpartyCount: number;
}

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  commissionPercent: number;
  commissionAmount: number;
  netAmount: number;
  originalAmount: number;
  description: string | null;
  date: string;
  account: {
    id: string;
    name: string;
    currency: string;
    commission: number;
  };
  counterparty: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
}

export default function FinanceProjectsPage() {
  if (process.env.NODE_ENV === 'development') {
    console.log('FinanceProjectsPage: Компонент инициализирован');
  }

  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'on_hold' | 'cancelled'>('all');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived'>('active');
  const [sortField, setSortField] = useState<'name' | 'income' | 'expenses' | 'netProfit' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal states
  const [operationsModalOpen, setOperationsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null);
  const [projectTransactions, setProjectTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Функция для открытия модального окна операций
  const openOperationsModal = async (project: ProjectWithStats) => {
    setSelectedProject(project);
    setOperationsModalOpen(true);
    setTransactionsLoading(true);

    try {
      const response = await fetch(`/api/admin/finance/transactions?projectId=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setProjectTransactions(data.transactions || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Ошибка загрузки операций:', error);
      }
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchProjects = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('FinanceProjectsPage: fetchProjects вызвана');
      }
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (archiveFilter === 'archived') {
        params.append('archiveStatus', 'archived');
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.append('dateTo', dateTo);
      }

      const url = `/api/admin/finance/projects/stats?${params.toString()}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('FinanceProjectsPage: Запрос к URL:', url);
      }

      const response = await fetch(url);
      if (process.env.NODE_ENV === 'development') {
        console.log('FinanceProjectsPage: Ответ API:', response.status, response.statusText);
      }

      if (response.ok) {
        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('FinanceProjectsPage: Получены данные:', data);
        }
        setProjects(data.projects || []);
        if (process.env.NODE_ENV === 'development') {
          console.log('FinanceProjectsPage: Проекты установлены:', data.projects?.length || 0);
        }
      } else {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('FinanceProjectsPage: Не удалось распарсить ошибку API:', parseError);
          }
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('FinanceProjectsPage: Ошибка API:', errorMessage);
        }
        setError(errorMessage);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('FinanceProjectsPage: Ошибка сети:', error);
      }
      setError('Ошибка сети при загрузке проектов');
    } finally {
      setLoading(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('FinanceProjectsPage: Загрузка завершена');
      }
    }
  }, [filter, archiveFilter, dateFrom, dateTo]);

  useEffect(() => {
    // Загружаем проекты только на клиенте
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.log('FinanceProjectsPage: Начинаем загрузку данных...');
      }
      fetchProjects();
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('FinanceProjectsPage: SSR режим, пропускаем загрузку данных');
      }
    }
  }, [fetchProjects]);

  // Сортировка проектов
  const sortedProjects = [...projects].sort((a, b) => {
    let aValue: string | number = a[sortField as keyof ProjectWithStats] as string | number;
    let bValue: string | number = b[sortField as keyof ProjectWithStats] as string | number;

    if (sortField === 'name') {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ACTIVE': 'Активный',
      'COMPLETED': 'Завершен',
      'ON_HOLD': 'На паузе',
      'CANCELLED': 'Отменен',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'COMPLETED': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'ON_HOLD': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Функция для сброса фильтров по датам
  const resetDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    if (process.env.NODE_ENV === 'development') {
      console.log('FinanceProjectsPage: Отображаем состояние загрузки');
    }
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        <p className="text-gray-600 dark:text-gray-400">Загрузка проектов...</p>
      </div>
    );
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('FinanceProjectsPage: Отображаем ошибку:', error);
    }
    return (
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Ошибка загрузки проектов</h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchProjects()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('FinanceProjectsPage: Рендерим основной контент, проектов:', projects.length);
  }

  return (
    <>
      {/* Отладочная информация */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Отладка</h4>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            <div>Проектов: {projects.length}</div>
            <div>Фильтр: {filter}</div>
            <div>Архив: {archiveFilter}</div>
            <div>Сортировка: {sortField} ({sortDirection})</div>
          </div>
        </div>
      )}

      {/* Модальное окно операций проекта */}
      {operationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOperationsModalOpen(false)} />

          <div className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#171717]/10 dark:border-[#ededed]/10">
              <div>
                <h3 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#2563eb]/10 dark:bg-[#2563eb]/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#2563eb]" />
                  </div>
                  Операции проекта &quot;{selectedProject?.name}&quot;
                </h3>
                <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
                  Финансовые операции и транзакции проекта
                </p>
              </div>
              <button
                onClick={() => setOperationsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {transactionsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto mb-4"></div>
                    <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Загрузка операций...</p>
                  </div>
                </div>
              ) : projectTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[#171717]/40 dark:text-[#ededed]/40" />
                  </div>
                  <h4 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
                    Операций не найдено
                  </h4>
                  <p className="text-[#171717]/60 dark:text-[#ededed]/60">
                    Для этого проекта еще не было финансовых операций
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#171717]/10 dark:divide-[#ededed]/10">
                    <thead className="bg-[#171717]/5 dark:bg-[#ededed]/5 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Тип операции
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Комиссия
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Счет
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Контрагент
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Категория
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                          Описание
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#0a0a0a] divide-y divide-[#171717]/5 dark:divide-[#ededed]/10">
                      {projectTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                              {new Date(transaction.date).toLocaleDateString('ru-RU')}
                            </div>
                            <div className="text-xs text-[#171717]/50 dark:text-[#ededed]/50">
                              {new Date(transaction.date).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                              transaction.type === 'INCOME'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {transaction.type === 'INCOME' ? 'Пополнение' : 'Расход'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                                {formatCurrency(transaction.amount, transaction.account?.currency)}
                              </div>
                              {transaction.commissionAmount > 0 && (
                                <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                                  Чистая: {formatCurrency(transaction.netAmount, transaction.account?.currency)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {transaction.commissionPercent > 0 ? (
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                                  {transaction.commissionPercent}%
                                </div>
                                <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                                  {formatCurrency(transaction.commissionAmount, transaction.account?.currency)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-[#171717]/50 dark:text-[#ededed]/50">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                              {transaction.account?.name}
                            </div>
                            <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                              {transaction.account?.currency}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                              {transaction.counterparty?.name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                              {transaction.category?.name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#171717] dark:text-[#ededed] max-w-xs">
                              {transaction.description || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-[#171717]/10 dark:border-[#ededed]/10">
              <button
                onClick={() => setOperationsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#171717]/80 dark:text-[#ededed]/80 bg-[#171717]/5 dark:bg-[#ededed]/5 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/10 rounded-lg transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
              Финансовые проекты
            </h1>
            <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
              Обзор проектов с финансовой статистикой
            </p>
          </div>
          <div className="text-sm text-[#171717]/40 dark:text-[#ededed]/40">
            Обновлено: {typeof window !== 'undefined' ? new Date().toLocaleString('ru-RU') : 'Загрузка...'}
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <div className="flex flex-wrap gap-4">
            {/* Фильтр по статусу */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Статус проекта
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="completed">Завершенные</option>
                <option value="on_hold">На паузе</option>
                <option value="cancelled">Отмененные</option>
              </select>
            </div>

            {/* Фильтр архива */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Архив
              </label>
              <select
                value={archiveFilter}
                onChange={(e) => setArchiveFilter(e.target.value as any)}
                className="px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              >
                <option value="active">Активные</option>
                <option value="archived">Архивные</option>
              </select>
            </div>

            {/* Фильтр по дате создания - От */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Дата создания от
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
            </div>

            {/* Фильтр по дате создания - До */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Дата создания до
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
            </div>

            {/* Кнопка сброса фильтров */}
            {(dateFrom || dateTo) && (
              <div className="flex flex-col justify-end">
                <button
                  onClick={resetDateFilters}
                  className="px-4 py-2 text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 bg-[#171717]/5 dark:bg-[#ededed]/5 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/10 rounded-md transition-colors"
                >
                  Сбросить даты
                </button>
              </div>
            )}

            {/* Сортировка */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Сортировка
              </label>
              <div className="flex gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                >
                  <option value="name">По названию</option>
                  <option value="income">По доходам</option>
                  <option value="expenses">По расходам</option>
                  <option value="netProfit">По прибыли</option>
                  <option value="createdAt">По дате создания</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
                  title={sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Список проектов */}
        {sortedProjects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-[#171717]/40 dark:text-[#ededed]/40" />
            </div>
            <h3 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
              Проекты не найдены
            </h3>
            <p className="text-[#171717]/60 dark:text-[#ededed]/60">
              {filter !== 'all' || archiveFilter === 'archived' || dateFrom || dateTo
                ? 'Попробуйте изменить фильтры поиска'
                : 'Создайте первый проект для отслеживания финансов'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-6 hover:shadow-lg transition-all duration-200 hover:border-[#2563eb]/20 dark:hover:border-[#60a5fa]/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-[#2563eb]/10 dark:bg-[#2563eb]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-[#2563eb]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] truncate">
                          {project.name}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                        {project.isArchived && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            Архив
                          </span>
                        )}
                      </div>
                      
                      {project.description && (
                        <p className="text-[#171717]/60 dark:text-[#ededed]/60 text-sm mb-3">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-[#171717]/50 dark:text-[#ededed]/50">
                        <span>Создан: {formatDate(project.createdAt)}</span>
                        <span>Операций: {project.transactionCount}</span>
                        <span>Контрагентов: {project.counterpartyCount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => openOperationsModal(project)}
                    className="px-4 py-2 text-sm font-medium text-[#2563eb] dark:text-[#60a5fa] bg-[#2563eb]/10 dark:bg-[#60a5fa]/10 hover:bg-[#2563eb]/20 dark:hover:bg-[#60a5fa]/20 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Операции
                  </button>
                </div>

                {/* Финансовая статистика */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[#171717]/10 dark:border-[#ededed]/10">
                  {/* Доходы */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">Доходы</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(project.income)}
                      </p>
                    </div>
                  </div>

                  {/* Расходы */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">Расходы</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(project.expenses)}
                      </p>
                    </div>
                  </div>

                  {/* Прибыль */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      project.netProfit >= 0 
                        ? 'bg-purple-100 dark:bg-purple-900/30' 
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${
                        project.netProfit >= 0 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">Прибыль</p>
                      <p className={`text-lg font-bold ${
                        project.netProfit >= 0 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {formatCurrency(project.netProfit)}
                      </p>
                    </div>
                  </div>

                  {/* Контрагенты */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">Контрагенты</p>
                      <p className="text-lg font-bold text-[#171717] dark:text-[#ededed]">
                        {project.counterpartyCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Список контрагентов (если есть) */}
                {project.counterparties.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#171717]/10 dark:border-[#ededed]/10">
                    <p className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                      Связанные контрагенты:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.counterparties.slice(0, 5).map((counterparty) => (
                        <span
                          key={counterparty.id}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#171717]/5 dark:bg-[#ededed]/5 text-[#171717]/70 dark:text-[#ededed]/70"
                        >
                          {counterparty.name}
                        </span>
                      ))}
                      {project.counterparties.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#171717]/5 dark:bg-[#ededed]/5 text-[#171717]/70 dark:text-[#ededed]/70">
                          +{project.counterparties.length - 5} еще
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
