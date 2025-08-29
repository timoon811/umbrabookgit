"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

interface ProjectWithStats {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  income: number;
  expenses: number;
  netProfit: number;
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
  console.log('FinanceProjectsPage: Компонент инициализирован');

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
      console.error('Ошибка загрузки операций:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchProjects = useCallback(async () => {
    try {
      console.log('FinanceProjectsPage: fetchProjects вызвана');
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
      console.log('FinanceProjectsPage: Запрос к URL:', url);

      const response = await fetch(url);
      console.log('FinanceProjectsPage: Ответ API:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('FinanceProjectsPage: Получены данные:', data);
        setProjects(data.projects || []);
        console.log('FinanceProjectsPage: Проекты установлены:', data.projects?.length || 0);
      } else {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('FinanceProjectsPage: Не удалось распарсить ошибку API:', parseError);
        }
        console.error('FinanceProjectsPage: Ошибка API:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('FinanceProjectsPage: Ошибка сети:', error);
      setError('Ошибка сети при загрузке проектов');
    } finally {
      setLoading(false);
      console.log('FinanceProjectsPage: Загрузка завершена');
    }
  }, [filter, archiveFilter, dateFrom, dateTo]);

  useEffect(() => {
    // Загружаем проекты только на клиенте
    if (typeof window !== 'undefined') {
      console.log('FinanceProjectsPage: Начинаем загрузку данных...');
      fetchProjects();
    } else {
      console.log('FinanceProjectsPage: SSR режим, пропускаем загрузку данных');
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
    console.log('FinanceProjectsPage: Отображаем состояние загрузки');
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        <p className="text-gray-600 dark:text-gray-400">Загрузка проектов...</p>
      </div>
    );
  }

  if (error) {
    console.log('FinanceProjectsPage: Отображаем ошибку:', error);
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

  console.log('FinanceProjectsPage: Рендерим основной контент, проектов:', projects.length);

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
    </>
  );
}
