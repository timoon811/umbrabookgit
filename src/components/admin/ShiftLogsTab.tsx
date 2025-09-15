"use client";

import { useState, useEffect } from "react";
import { useNotificationContext } from '@/providers/NotificationProvider';

interface ShiftLog {
  id: string;
  processorId: string;
  shiftType: 'MORNING' | 'DAY' | 'NIGHT';
  shiftDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED';
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  processor: {
    name: string;
    email: string;
    telegram?: string;
  };
}

interface ShiftStats {
  total: number;
  scheduled: number;
  active: number;
  completed: number;
  missed: number;
}

interface ActionLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    telegram?: string;
    role: string;
  };
  shiftType: string;
  duration?: number;
  autoEnded: boolean;
  ip?: string;
  userAgent?: string;
}

interface ActionLogStats {
  total: number;
  shiftStarts: number;
  shiftEnds: number;
}

interface FilterParams {
  page: number;
  limit: number;
  processorId?: string;
  shiftType?: string;
  status?: string;
  dateFrom?: string;
}

export default function ShiftLogsTab() {
  const { showSuccess, showError, showShiftAlert } = useNotificationContext();
  const [shifts, setShifts] = useState<ShiftLog[]>([]);
  const [stats, setStats] = useState<ShiftStats | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [actionStats, setActionStats] = useState<ActionLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLogsLoading, setActionLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [activeTab, setActiveTab] = useState<'shifts' | 'actions'>('shifts');
  
  // Упрощенные фильтры
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 20,
  });

  // Пагинация
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (activeTab === 'shifts') {
      fetchShiftLogs();
    } else {
      fetchActionLogs();
    }
    fetchManagers();
  }, [filters, activeTab]);

  const fetchShiftLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/admin/shift-logs?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setShifts(data.shifts);
        setStats(data.stats);
        setPagination(data.pagination);
        
        // Проверяем проблемные смены и отправляем уведомления
        const missedShifts = data.shifts.filter((s: ShiftLog) => s.status === 'MISSED');
        const recentMissed = missedShifts.filter((s: ShiftLog) => {
          const shiftDate = new Date(s.shiftDate);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return shiftDate >= dayAgo;
        });
        
        recentMissed.forEach((shift: ShiftLog) => {
          showShiftAlert('missed', shift.processor.name, shift.shiftType);
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка загрузки логов смен');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/managers');
      if (response.ok) {
        const data = await response.json();
        setManagers(data.managers || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки менеджеров:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterParams, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const fetchActionLogs = async () => {
    try {
      setActionLogsLoading(true);
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      });

      if (filters.processorId) params.append('userId', filters.processorId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);

      const response = await fetch(`/api/admin/action-logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setActionLogs(data.logs);
        setActionStats(data.stats);
      } else {
        setError(data.error || 'Ошибка загрузки логов действий');
      }
    } catch (error) {
      setError('Ошибка сети при загрузке логов действий');
    } finally {
      setActionLogsLoading(false);
    }
  };


  const createTestData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/test-shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchShiftLogs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания тестовых данных');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const getShiftTypeIcon = (type: string) => {
    switch (type) {
      case 'MORNING':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'DAY':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'NIGHT':
        return (
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'ACTIVE':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 110 5H9V10z" />
          </svg>
        );
      case 'COMPLETED':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'MISSED':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'SCHEDULED': 'Запланирована',
      'ACTIVE': 'Активна',
      'COMPLETED': 'Завершена',
      'MISSED': 'Пропущена'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'SCHEDULED': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
      'ACTIVE': 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      'COMPLETED': 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20',
      'MISSED': 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Ошибка загрузки</h3>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchShiftLogs}
          className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Вкладки */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'shifts'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Смены
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'actions'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Логи действий
        </button>
      </div>

      {activeTab === 'shifts' && (
        <>
          {/* Компактная статистика */}
          {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{stats.total}</div>
              <div className="text-xs text-gray-500">Всего</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{stats.scheduled}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Запланировано</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 110 5H9V10z" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">{stats.active}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Активных</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{stats.completed}</div>
              <div className="text-xs text-gray-500">Завершено</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-red-700 dark:text-red-300">{stats.missed}</div>
              <div className="text-xs text-red-600 dark:text-red-400">Пропущено</div>
            </div>
          </div>
        </div>
      )}

      {/* Компактные фильтры */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400">Фильтры:</span>
        </div>
        
        <select
          value={filters.processorId || ''}
          onChange={(e) => handleFilterChange('processorId', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="">Все менеджери</option>
          {managers.map(manager => (
            <option key={manager.id} value={manager.id}>
              {manager.name}
            </option>
          ))}
        </select>
        
        <select
          value={filters.shiftType || ''}
          onChange={(e) => handleFilterChange('shiftType', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="">Все типы</option>
          <option value="MORNING">Утренние</option>
          <option value="DAY">Дневные</option>
          <option value="NIGHT">Ночные</option>
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="">Все статусы</option>
          <option value="SCHEDULED">Запланированные</option>
          <option value="ACTIVE">Активные</option>
          <option value="COMPLETED">Завершенные</option>
          <option value="MISSED">Пропущенные</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        />

        {(filters.processorId || filters.shiftType || filters.status || filters.dateFrom) && (
          <button
            onClick={() => setFilters({ page: 1, limit: 20 })}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Таблица логов */}
      <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Логи смен ({pagination.total})
          </h4>
          <div className="flex items-center gap-2">
            {shifts.length === 0 && (
              <button
                onClick={createTestData}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50 transition-colors"
              >
                Создать тестовые данные
              </button>
            )}
            <button
              onClick={fetchShiftLogs}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {shifts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Нет данных о сменах
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Менеджеры еще не начали использовать систему смен
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Менеджер
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Смена
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Запланировано
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Фактически
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {shift.processor.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {shift.processor.email}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4">
                          {getShiftTypeIcon(shift.shiftType)}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shift.shiftType === 'MORNING' ? 'Утро' : 
                           shift.shiftType === 'DAY' ? 'День' : 'Ночь'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(shift.shiftDate)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {formatTime(shift.scheduledStart)} - {formatTime(shift.scheduledEnd)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {shift.actualStart ? (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <div>{formatTime(shift.actualStart)}</div>
                          {shift.actualEnd && (
                            <div className="text-xs text-gray-500">до {formatTime(shift.actualEnd)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Не начата</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(shift.status)}`}>
                        <div className="w-3 h-3">
                          {getStatusIcon(shift.status)}
                        </div>
                        {getStatusLabel(shift.status)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Компактная пагинация */}
        {pagination.pages > 1 && (
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFilterChange('page', pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => handleFilterChange('page', pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'actions' && (
        <>
          {/* Статистика логов действий */}
          {actionStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{actionStats.total}</div>
                  <div className="text-xs text-gray-500">Всего действий</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <div>
                  <div className="text-lg font-semibold text-green-700 dark:text-green-300">{actionStats.shiftStarts}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Начато смен</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <div>
                  <div className="text-lg font-semibold text-red-700 dark:text-red-300">{actionStats.shiftEnds}</div>
                  <div className="text-xs text-red-600 dark:text-red-400">Завершено смен</div>
                </div>
              </div>
            </div>
          )}

          {/* Фильтры для логов действий */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Менеджер
                </label>
                <select
                  value={filters.processorId || ''}
                  onChange={(e) => handleFilterChange('processorId', e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все менеджеры</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Дата от
                </label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    page: 1,
                    limit: 20,
                  })}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>

          {/* Таблица логов действий */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {actionLogsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : actionLogs.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Логи действий не найдены</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/20">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Действие
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Время
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Детали
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {actionLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {log.user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.user.email}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {log.action === 'SHIFT_START' && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            {log.action === 'SHIFT_END' && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {log.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {new Date(log.createdAt).toLocaleString('ru-RU', {
                              timeZone: 'Europe/Moscow',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.shiftType && (
                              <div>Тип: {log.shiftType}</div>
                            )}
                            {log.duration && (
                              <div>Длительность: {Math.round(log.duration / 60000)} мин</div>
                            )}
                            {log.autoEnded && (
                              <div className="text-orange-600 dark:text-orange-400">Автозавершение</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Пагинация для логов действий */}
            {pagination.pages > 1 && (
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="p-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}