"use client";

import { useState, useEffect } from 'react';
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

interface Processor {
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
  const [salaryRequests, setSalaryRequests] = useState<SalaryRequest[]>([]);
  const [processors, setProcessors] = useState<Processor[]>([]);
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
        setProcessors(data.processors);
        setPagination(data.pagination);
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
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка обработки заявки:', error);
      alert('Ошибка при обработке заявки');
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
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Заявки на зарплату
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Всего: {pagination.total} заявок
          </div>
        </div>
        
        {/* Статистика по статусам */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['PENDING', 'APPROVED', 'REJECTED', 'PAID'].map(status => {
            const count = salaryRequests.filter(r => r.status === status).length;
            const statusInfo = getStatusInfo(status);
            const Icon = statusInfo.icon;
            
            return (
              <div key={status} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{statusInfo.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Поиск */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по процессору..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Статус */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Все статусы</option>
              <option value="PENDING">Ожидает</option>
              <option value="APPROVED">Одобрена</option>
              <option value="REJECTED">Отклонена</option>
              <option value="PAID">Выплачена</option>
            </select>
          </div>

          {/* Процессор */}
          <div>
            <select
              value={filters.processorId}
              onChange={(e) => setFilters(prev => ({ ...prev, processorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Все процессоры</option>
              {processors.map(processor => (
                <option key={processor.id} value={processor.id}>
                  {processor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Сброс */}
          <div>
            <button
              onClick={resetFilters}
              className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Сброс
            </button>
          </div>
        </div>

        {/* Дополнительные фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Дата с
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Дата по
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Сортировка
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="createdAt-desc">Дата создания ↓</option>
              <option value="createdAt-asc">Дата создания ↑</option>
              <option value="requestedAmount-desc">Сумма ↓</option>
              <option value="requestedAmount-asc">Сумма ↑</option>
              <option value="processor-asc">Процессор А-Я</option>
              <option value="processor-desc">Процессор Я-А</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица заявок */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Процессор
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Период
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {salaryRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                const Icon = statusInfo.icon;
                
                return (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {request.processor.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {request.processor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(request.periodStart)} - {formatDate(request.periodEnd)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(request.requestedAmount)}
                      </div>
                      {request.calculatedAmount && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Расч.: {formatCurrency(request.calculatedAmount)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(request.createdAt)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openDetailsModal(request)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Просмотр деталей"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openActionModal(request, 'APPROVED')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Одобрить"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => openActionModal(request, 'REJECTED')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Отклонить"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {request.status === 'REJECTED' && (
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {pagination.pages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Показано{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}до{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}из{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}результатов
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно деталей */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Детали заявки на зарплату
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Процессор
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedRequest.processor.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedRequest.processor.email}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Статус
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedRequest.status).color}`}>
                    {getStatusInfo(selectedRequest.status).label}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Период
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(selectedRequest.periodStart)} - {formatDate(selectedRequest.periodEnd)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Сумма
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(selectedRequest.requestedAmount)}
                  </p>
                  {selectedRequest.calculatedAmount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Расчетная: {formatCurrency(selectedRequest.calculatedAmount)}
                    </p>
                  )}
                </div>
              </div>
              
              {selectedRequest.comment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Комментарий процессора
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {selectedRequest.comment}
                  </p>
                </div>
              )}
              
              {selectedRequest.adminComment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Комментарий администратора
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    {selectedRequest.adminComment}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Создано:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {formatDate(selectedRequest.createdAt)}
                  </span>
                </div>
                
                {selectedRequest.processedAt && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Обработано:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {formatDate(selectedRequest.processedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно действий */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {actionData.status === 'APPROVED' ? 'Одобрить заявку' : 'Отклонить заявку'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Комментарий (необязательно)
              </label>
              <textarea
                value={actionData.adminComment}
                onChange={(e) => setActionData(prev => ({ ...prev, adminComment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                placeholder="Причина одобрения или отклонения..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleAction(actionData.id, actionData.status, actionData.adminComment)}
                disabled={submitting === actionData.id}
                className={`flex-1 py-2 px-4 rounded text-white transition-colors ${
                  actionData.status === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                    : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
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
