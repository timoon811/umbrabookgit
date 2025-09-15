"use client";

import { useState, useEffect } from "react";
import { BuyerRequest, BuyerProject, BuyerRequestForm, ConsumableItem, BuyerRequestFilters } from "@/types/buyer";

interface BuyerRequestsListProps {
  requests?: BuyerRequest[];
  compact?: boolean;
}

export default function BuyerRequestsList({ requests: propRequests = [], compact = false }: BuyerRequestsListProps) {
  const [requests, setRequests] = useState<BuyerRequest[]>(propRequests);
  const [projects, setProjects] = useState<BuyerProject[]>([]);
  const [loading, setLoading] = useState(!compact);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BuyerRequest | null>(null);
  const [filters, setFilters] = useState<BuyerRequestFilters>({
    type: 'all',
    status: 'all',
    projectId: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (!compact) {
      loadData();
    }
  }, [compact, filters]);

  const loadData = async () => {
    if (compact) return;
    
    try {
      setLoading(true);
      
      // Загружаем проекты
      const projectsResponse = await fetch('/api/buyer/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }

      // Загружаем заявки
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      const requestsResponse = await fetch(`/api/buyer/requests?${params}`);
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRequests(requestsData.requests || []);
      } else {
        setError('Ошибка загрузки заявок');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = () => {
    setEditingRequest(null);
    setShowCreateModal(true);
  };

  const handleEditRequest = (request: BuyerRequest) => {
    setEditingRequest(request);
    setShowCreateModal(true);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
      case 'SUBMITTED':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'APPROVED':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'FULFILLED':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'PAID':
        return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Черновик';
      case 'SUBMITTED': return 'На рассмотрении';
      case 'APPROVED': return 'Одобрено';
      case 'REJECTED': return 'Отклонено';
      case 'FULFILLED': return 'Выполнено';
      case 'PAID': return 'Оплачено';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BUDGET': return 'Бюджет';
      case 'CONSUMABLES': return 'Расходники';
      case 'ACCESS': return 'Доступы';
      case 'PAYOUT': return 'Выплата';
      case 'CUSTOM': return 'Прочее';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BUDGET':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'CONSUMABLES':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'ACCESS':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'PAYOUT':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'CUSTOM':
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading && !compact) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !compact) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {requests.slice(0, 5).map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(request.type)}`}>
                  {getTypeLabel(request.type)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {request.title}
              </div>
              {request.amount && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ${request.amount.toLocaleString()}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(request.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </div>
        ))}
        
        {requests.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Заявок нет</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Мои заявки
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Управление заявками на бюджет, расходники и выплаты
            </p>
          </div>
          
          <button 
            onClick={handleCreateRequest}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Создать заявку</span>
            </div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип заявки
            </label>
            <select
              value={filters.type || 'all'}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Все типы</option>
              <option value="BUDGET">Бюджет</option>
              <option value="CONSUMABLES">Расходники</option>
              <option value="ACCESS">Доступы</option>
              <option value="PAYOUT">Выплата</option>
              <option value="CUSTOM">Прочее</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Статус
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Все статусы</option>
              <option value="DRAFT">Черновики</option>
              <option value="SUBMITTED">На рассмотрении</option>
              <option value="APPROVED">Одобренные</option>
              <option value="REJECTED">Отклоненные</option>
              <option value="FULFILLED">Выполненные</option>
              <option value="PAID">Оплаченные</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Проект
            </label>
            <select
              value={filters.projectId || 'all'}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Все проекты</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Дата от
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Название, описание..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Заявки не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              У вас пока нет заявок. Создайте заявку на бюджет или расходники.
            </p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Создать заявку
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(request.type)}`}>
                        {getTypeLabel(request.type)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {request.title}
                    </h3>
                    
                    {request.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {request.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                      {request.amount && (
                        <div className="flex items-center space-x-1">
                          <span>Сумма:</span>
                          <span className="font-medium">${request.amount.toLocaleString()}</span>
                        </div>
                      )}
                      {request.project && (
                        <div className="flex items-center space-x-1">
                          <span>Проект:</span>
                          <span className="font-medium">{request.project.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Создана: {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                      {request.processedAt && (
                        <span className="ml-4">
                          Обработана: {new Date(request.processedAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                    
                    {request.adminComment && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="text-xs font-medium text-yellow-800 dark:text-yellow-400">Комментарий админа:</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">{request.adminComment}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {request.status === 'DRAFT' && (
                      <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <RequestModal
          request={editingRequest}
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Модальное окно для создания/редактирования заявки
interface RequestModalProps {
  request?: BuyerRequest | null;
  projects: BuyerProject[];
  onClose: () => void;
  onSave: () => void;
}

function RequestModal({ request, projects, onClose, onSave }: RequestModalProps) {
  const [form, setForm] = useState<BuyerRequestForm>({
    projectId: request?.projectId || '',
    type: request?.type || 'BUDGET',
    title: request?.title || '',
    description: request?.description || '',
    amount: request?.amount || 0,
    deliveryMethod: request?.deliveryMethod || '',
    payoutPeriod: request?.payoutPeriod || '',
    walletAddress: request?.walletAddress || '',
    items: []
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title) {
      alert('Название обязательно');
      return;
    }

    setSaving(true);
    try {
      const url = request ? `/api/buyer/requests/${request.id}` : '/api/buyer/requests';
      const method = request ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      alert('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {request ? 'Редактировать заявку' : 'Новая заявка'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Тип заявки *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="BUDGET">Бюджет</option>
                <option value="CONSUMABLES">Расходники</option>
                <option value="ACCESS">Доступы</option>
                <option value="PAYOUT">Выплата</option>
                <option value="CUSTOM">Прочее</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Проект
              </label>
              <select
                value={form.projectId || ''}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Общая заявка</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Кратко опишите заявку..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Подробное описание заявки..."
            />
          </div>

          {(form.type === 'BUDGET' || form.type === 'PAYOUT') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Сумма (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {form.type === 'BUDGET' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Способ получения
              </label>
              <input
                type="text"
                value={form.deliveryMethod || ''}
                onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Криптокошелёк, рекламный кабинет..."
              />
            </div>
          )}

          {form.type === 'PAYOUT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Период выплаты
                </label>
                <select
                  value={form.payoutPeriod || ''}
                  onChange={(e) => setForm({ ...form, payoutPeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Выберите период</option>
                  <option value="1-15">1-15 число</option>
                  <option value="16-end">16-конец месяца</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Кошелёк
                </label>
                <input
                  type="text"
                  value={form.walletAddress || ''}
                  onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Адрес криптокошелька..."
                />
              </div>
            </div>
          )}

          {form.type === 'CONSUMABLES' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Расходники
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Опишите необходимые расходники в описании (аккаунты, прокси, домены и т.д.)
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Сохранение...' : (request ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
