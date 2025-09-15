"use client";

import { useState, useEffect } from 'react';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { 
  DollarSign, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Trash2,
  Eye,
  MessageSquare
} from 'lucide-react';

interface SalaryRequest {
  id: string;
  periodStart: string;
  periodEnd: string;
  requestedAmount: number;
  calculatedAmount?: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  comment?: string;
  adminComment?: string;
  createdAt: string;
  processedAt?: string;
  paidAt?: string;
  processor: {
    id: string;
    name: string;
    email: string;
    telegram?: string;
  };
}

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function SalaryRequestsTab() {
  const { showSalaryAlert, showSuccess, showError } = useNotificationContext();
  const [salaryRequests, setSalaryRequests] = useState<SalaryRequest[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  // Фильтры
  const [filters, setFilters] = useState({
    status: 'all',
    processorId: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  
  // Сортировка
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Модальные окна
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SalaryRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({
    id: '',
    status: '',
    adminComment: ''
  });

  // Загрузка данных
  const loadSalaryRequests = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        processorId: filters.processorId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: filters.search,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/salary-requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSalaryRequests(data.salaryRequests);
        setManagers(data.managers);
        setPagination(data.pagination);
        
        // Проверяем расхождения в зарплатах
        const discrepancies = data.salaryRequests.filter((req: SalaryRequest) => {
          return req.calculatedAmount && 
                 Math.abs(req.calculatedAmount - req.requestedAmount) > 10; // порог $10
        });
        
        discrepancies.forEach((req: SalaryRequest) => {
          showSalaryAlert(req.calculatedAmount!, req.requestedAmount, req.processor.name);
        });
      } else {
        console.error('Ошибка загрузки заявок:', await response.text());
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaryRequests();
  }, [pagination.page, filters, sortBy, sortOrder]);

  // Обработка действий с заявками
  const handleAction = async (id: string, status: string, adminComment: string) => {
    try {
      setSubmitting(id);
      
      const response = await fetch('/api/admin/salary-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminComment })
      });

      if (response.ok) {
        await loadSalaryRequests();
        setShowActionModal(false);
        setActionData({ id: '', status: '', adminComment: '' });
      } else {
        const error = await response.json();
        showError('Ошибка обработки', error.error || 'Не удалось обработать заявку', 'ЗП');
      }
    } catch (error) {
      console.error('Ошибка обработки заявки:', error);
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'ЗП');
    } finally {
      setSubmitting(null);
    }
  };

  // Удаление заявки
  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;

    try {
      const response = await fetch(`/api/admin/salary-requests?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSalaryRequests();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка удаления заявки:', error);
      alert('Ошибка при удалении заявки');
    }
  };

  // Открытие модального окна действий
  const openActionModal = (request: SalaryRequest, status: string) => {
    setActionData({
      id: request.id,
      status,
      adminComment: ''
    });
    setShowActionModal(true);
  };

  // Открытие модального окна деталей
  const openDetailsModal = (request: SalaryRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      status: 'all',
      processorId: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Форматирование валюты
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Получение статуса заявки
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          label: 'Ожидает', 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: Clock
        };
      case 'APPROVED':
        return { 
          label: 'Одобрена', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: CheckCircle
        };
      case 'REJECTED':
        return { 
          label: 'Отклонена', 
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: XCircle
        };
      case 'PAID':
        return { 
          label: 'Выплачена', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: DollarSign
        };
      default:
        return { 
          label: status, 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: Clock
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Компактная статистика */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-4 border border-[#171717]/5 dark:border-[#ededed]/10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
            Всего заявок: <span className="font-medium text-[#171717] dark:text-[#ededed]">{pagination.total}</span>
          </div>
        </div>
        
        {/* Компактная статистика по статусам */}
        <div className="grid grid-cols-4 gap-3">
          {['PENDING', 'APPROVED', 'REJECTED', 'PAID'].map(status => {
            const count = salaryRequests.filter(r => r.status === status).length;
            const statusInfo = getStatusInfo(status);
            const Icon = statusInfo.icon;
            
            return (
              <div key={status} className="text-center p-2 bg-[#171717]/[0.02] dark:bg-[#ededed]/5 rounded-lg hover:bg-[#171717]/[0.04] dark:hover:bg-[#ededed]/10 transition-colors">
                <Icon className="w-4 h-4 mx-auto mb-1 text-[#171717]/60 dark:text-[#ededed]/60" />
                <div className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">{count}</div>
                <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">{statusInfo.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Компактные фильтры */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-4 border border-[#171717]/5 dark:border-[#ededed]/10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Поиск */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#171717]/40 dark:text-[#ededed]/40" />
              <input
                type="text"
                placeholder="Поиск по менеджеру..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 text-sm border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] placeholder:text-[#171717]/40 dark:placeholder:text-[#ededed]/40"
              />
            </div>
          </div>

          {/* Статус */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]"
            >
              <option value="all">Все статусы</option>
              <option value="PENDING">Ожидает</option>
              <option value="APPROVED">Одобрена</option>
              <option value="REJECTED">Отклонена</option>
              <option value="PAID">Выплачена</option>
            </select>
          </div>

          {/* Менеджер */}
          <div>
            <select
              value={filters.processorId}
              onChange={(e) => setFilters(prev => ({ ...prev, processorId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]"
            >
              <option value="all">Все менеджеры</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>

          {/* Сброс */}
          <div>
            <button
              onClick={resetFilters}
              className="w-full px-3 py-2 text-sm bg-[#171717]/5 dark:bg-[#ededed]/5 text-[#171717] dark:text-[#ededed] rounded-lg hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/10 transition-colors border border-[#171717]/10 dark:border-[#ededed]/10"
            >
              Сброс
            </button>
          </div>
        </div>

        {/* Дополнительные фильтры в одну строку */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#171717]/5 dark:border-[#ededed]/10">
          <div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]"
              placeholder="Дата с"
            />
          </div>
          
          <div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]"
              placeholder="Дата по"
            />
          </div>

          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 text-sm border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed]"
            >
              <option value="createdAt-desc">Дата ↓</option>
              <option value="createdAt-asc">Дата ↑</option>
              <option value="requestedAmount-desc">Сумма ↓</option>
              <option value="requestedAmount-asc">Сумма ↑</option>
              <option value="manager-asc">Менеджер А-Я</option>
              <option value="manager-desc">Менеджер Я-А</option>
            </select>
          </div>
        </div>
      </div>

      {/* Компактная таблица заявок */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#171717]/[0.02] dark:bg-[#ededed]/5 border-b border-[#171717]/5 dark:border-[#ededed]/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Менеджер
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Период
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5 dark:divide-[#ededed]/10">
              {salaryRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="text-[#171717]/40 dark:text-[#ededed]/40">
                      <Calendar className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Заявки не найдены</p>
                    </div>
                  </td>
                </tr>
              ) : (
                salaryRequests.map((request) => {
                  const statusInfo = getStatusInfo(request.status);
                  const Icon = statusInfo.icon;
                  
                  return (
                    <tr key={request.id} className="hover:bg-[#171717]/[0.02] dark:hover:bg-[#ededed]/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#171717]/10 dark:bg-[#ededed]/10 rounded-lg flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-[#171717]/60 dark:text-[#ededed]/60" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                              {request.processor.name}
                            </div>
                            <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                              {request.processor.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#171717] dark:text-[#ededed]">
                          {formatDate(request.periodStart)}
                        </div>
                        <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                          до {formatDate(request.periodEnd)}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                          {formatCurrency(request.requestedAmount)}
                        </div>
                        {request.calculatedAmount && (
                          <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                            Расч.: {formatCurrency(request.calculatedAmount)}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusInfo.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      
                      <td className="px-4 py-3 text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                        {formatDate(request.createdAt)}
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openDetailsModal(request)}
                            className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Просмотр деталей"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {request.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openActionModal(request, 'APPROVED')}
                                className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                title="Одобрить"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => openActionModal(request, 'REJECTED')}
                                className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Отклонить"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {request.status === 'REJECTED' && (
                            <button
                              onClick={() => handleDelete(request.id)}
                              className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Компактная пагинация */}
        {pagination.pages > 1 && (
          <div className="bg-white dark:bg-[#0a0a0a] px-4 py-3 border-t border-[#171717]/5 dark:border-[#ededed]/10">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 text-sm font-medium rounded-lg text-[#171717] dark:text-[#ededed] bg-white dark:bg-[#0a0a0a] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 text-sm font-medium rounded-lg text-[#171717] dark:text-[#ededed] bg-white dark:bg-[#0a0a0a] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Вперед
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                    Показано{' '}
                    <span className="font-medium text-[#171717] dark:text-[#ededed]">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}до{' '}
                    <span className="font-medium text-[#171717] dark:text-[#ededed]">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}из{' '}
                    <span className="font-medium text-[#171717] dark:text-[#ededed]">{pagination.total}</span>
                    {' '}результатов
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg border border-[#171717]/10 dark:border-[#ededed]/10 overflow-hidden">
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                      let page;
                      if (pagination.pages <= 5) {
                        page = i + 1;
                      } else {
                        const start = Math.max(1, pagination.page - 2);
                        const end = Math.min(pagination.pages, start + 4);
                        page = start + i;
                        if (page > end) return null;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border-r border-[#171717]/10 dark:border-[#ededed]/10 last:border-r-0 transition-colors ${
                            page === pagination.page
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-white dark:bg-[#0a0a0a] text-[#171717]/60 dark:text-[#ededed]/60 hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 hover:text-[#171717] dark:hover:text-[#ededed]'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }).filter(Boolean)}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно деталей */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Детали заявки
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-[#171717]/40 dark:text-[#ededed]/40 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                    Менеджер
                  </label>
                  <div className="p-3 bg-[#171717]/[0.02] dark:bg-[#ededed]/5 rounded-lg">
                    <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                      {selectedRequest.processor.name}
                    </p>
                    <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                      {selectedRequest.processor.email}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                    Статус
                  </label>
                  <div className="p-3 bg-[#171717]/[0.02] dark:bg-[#ededed]/5 rounded-lg">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusInfo(selectedRequest.status).color}`}>
                      {getStatusInfo(selectedRequest.status).label}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                    Период
                  </label>
                  <div className="p-3 bg-[#171717]/[0.02] dark:bg-[#ededed]/5 rounded-lg">
                    <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                      {formatDate(selectedRequest.periodStart)}
                    </p>
                    <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                      до {formatDate(selectedRequest.periodEnd)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                    Сумма
                  </label>
                  <div className="p-3 bg-[#171717]/[0.02] dark:bg-[#ededed]/5 rounded-lg">
                    <p className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                      {formatCurrency(selectedRequest.requestedAmount)}
                    </p>
                    {selectedRequest.calculatedAmount && (
                      <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                        Расчетная: {formatCurrency(selectedRequest.calculatedAmount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedRequest.comment && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                    Комментарий менеджера
                  </label>
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 rounded-lg">
                    <p className="text-sm text-[#171717] dark:text-[#ededed]">
                      {selectedRequest.comment}
                    </p>
                  </div>
                </div>
              )}
              
              {selectedRequest.adminComment && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                    Комментарий администратора
                  </label>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-500/10 border border-purple-200/50 dark:border-purple-500/20 rounded-lg">
                    <p className="text-sm text-[#171717] dark:text-[#ededed]">
                      {selectedRequest.adminComment}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-[#171717]/10 dark:border-[#ededed]/10">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#171717]/60 dark:text-[#ededed]/60">Создано:</span>
                    <span className="font-medium text-[#171717] dark:text-[#ededed]">
                      {formatDate(selectedRequest.createdAt)}
                    </span>
                  </div>
                  
                  {selectedRequest.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-[#171717]/60 dark:text-[#ededed]/60">Обработано:</span>
                      <span className="font-medium text-[#171717] dark:text-[#ededed]">
                        {formatDate(selectedRequest.processedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно действий */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/10 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-6">
              {actionData.status === 'APPROVED' ? 'Одобрить заявку' : 'Отклонить заявку'}
            </h3>
            
            <div className="mb-6">
              <label className="block text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider mb-2">
                Комментарий (необязательно)
              </label>
              <textarea
                value={actionData.adminComment}
                onChange={(e) => setActionData(prev => ({ ...prev, adminComment: e.target.value }))}
                className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] placeholder:text-[#171717]/40 dark:placeholder:text-[#ededed]/40 resize-none"
                rows={3}
                placeholder="Причина одобрения или отклонения..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 bg-[#171717]/5 dark:bg-[#ededed]/5 text-[#171717] dark:text-[#ededed] py-2.5 px-4 rounded-lg hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/10 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                onClick={() => handleAction(actionData.id, actionData.status, actionData.adminComment)}
                disabled={submitting === actionData.id}
                className={`flex-1 py-2.5 px-4 rounded-lg text-white transition-colors font-medium disabled:opacity-50 ${
                  actionData.status === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting === actionData.id ? 'Обработка...' : 
                 actionData.status === 'APPROVED' ? 'Одобрить' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
