"use client";

import { useState, useEffect } from "react";
import { BuyerSignal, BuyerSignalFilters } from "@/types/buyer";

export default function BuyerSignalsSystem() {
  const [signals, setSignals] = useState<BuyerSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [filters, setFilters] = useState<BuyerSignalFilters>({
    type: 'all',
    severity: 'all',
    status: 'all',
    projectId: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadSignals();
  }, [filters, activeTab]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      
      // Фильтр по активности в зависимости от таба
      if (activeTab === 'active') {
        params.append('status', 'ACTIVE');
      } else if (activeTab === 'resolved') {
        params.append('status', 'RESOLVED');
      }

      const response = await fetch(`/api/buyer/signals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSignals(data.signals || []);
      } else {
        setError('Ошибка загрузки сигналов');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSignal = async (signalId: string) => {
    try {
      const response = await fetch(`/api/buyer/signals/${signalId}/resolve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        loadSignals(); // Перезагружаем список
      } else {
        alert('Ошибка при закрытии сигнала');
      }
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  const handleSnoozeSignal = async (signalId: string, hours: number) => {
    try {
      const response = await fetch(`/api/buyer/signals/${signalId}/snooze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours })
      });
      
      if (response.ok) {
        loadSignals(); // Перезагружаем список
      } else {
        alert('Ошибка при откладывании сигнала');
      }
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'LOW':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '🔶';
      case 'LOW':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ROAS_DROPPED': return 'Падение ROAS';
      case 'BUDGET_EXCEEDED': return 'Превышен бюджет';
      case 'NO_DEPOSITS': return 'Нет депозитов';
      case 'HIGH_CPA': return 'Высокий CPA';
      case 'LOW_CONVERSION': return 'Низкая конверсия';
      case 'ACCOUNT_ISSUES': return 'Проблемы с аккаунтом';
      case 'COMPLIANCE': return 'Комплаенс';
      case 'PERFORMANCE': return 'Производительность';
      case 'TECHNICAL': return 'Технические проблемы';
      case 'CUSTOM': return 'Прочее';
      default: return type;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ч назад`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} дн назад`;
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  const criticalSignals = signals.filter(s => s.severity === 'CRITICAL').length;
  const highSignals = signals.filter(s => s.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Header с сводкой */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Сигналы и алерты
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Мониторинг производительности и критических событий
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {criticalSignals > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="text-red-600 dark:text-red-400">🚨</span>
                <span className="text-sm font-medium text-red-800 dark:text-red-400">
                  {criticalSignals} критических
                </span>
              </div>
            )}
            
            {highSignals > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                <span className="text-sm font-medium text-orange-800 dark:text-orange-400">
                  {highSignals} важных
                </span>
              </div>
            )}
            
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Настройки алертов
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'active', name: 'Активные', icon: '🔴' },
              { id: 'resolved', name: 'Решенные', icon: '✅' },
              { id: 'settings', name: 'Настройки', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.id === 'active' && signals.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 text-xs rounded-full">
                    {signals.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'settings' ? (
            <SignalSettings />
          ) : (
            <>
              {/* Фильтры */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тип сигнала
                  </label>
                  <select
                    value={filters.type || 'all'}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="all">Все типы</option>
                    <option value="ROAS_DROPPED">Падение ROAS</option>
                    <option value="BUDGET_EXCEEDED">Превышен бюджет</option>
                    <option value="NO_DEPOSITS">Нет депозитов</option>
                    <option value="HIGH_CPA">Высокий CPA</option>
                    <option value="LOW_CONVERSION">Низкая конверсия</option>
                    <option value="ACCOUNT_ISSUES">Проблемы с аккаунтом</option>
                    <option value="COMPLIANCE">Комплаенс</option>
                    <option value="TECHNICAL">Технические</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Приоритет
                  </label>
                  <select
                    value={filters.severity || 'all'}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="all">Все приоритеты</option>
                    <option value="CRITICAL">Критический</option>
                    <option value="HIGH">Высокий</option>
                    <option value="MEDIUM">Средний</option>
                    <option value="LOW">Низкий</option>
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
                    <option value="1">Beauty Offers - Facebook</option>
                    <option value="2">Finance Offers - Google</option>
                    <option value="3">Crypto Trading - Native</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Поиск
                  </label>
                  <input
                    type="text"
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Поиск по тексту..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Список сигналов */}
              {signals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-6h4v6zm-4-8V3h4v6h-4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {activeTab === 'active' ? 'Нет активных сигналов' : 'Нет решенных сигналов'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeTab === 'active' 
                      ? 'Отлично! Все проекты работают в нормальном режиме.' 
                      : 'Здесь будут отображаться решенные сигналы.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signals.map((signal) => (
                    <SignalCard 
                      key={signal.id} 
                      signal={signal}
                      onResolve={handleResolveSignal}
                      onSnooze={handleSnoozeSignal}
                      isActive={activeTab === 'active'}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент карточки сигнала
interface SignalCardProps {
  signal: BuyerSignal;
  onResolve: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  isActive: boolean;
}

function SignalCard({ signal, onResolve, onSnooze, isActive }: SignalCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      case 'HIGH':
        return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
      case 'LOW':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '🔶';
      case 'LOW': return 'ℹ️';
      default: return '📢';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ROAS_DROPPED': return 'Падение ROAS';
      case 'BUDGET_EXCEEDED': return 'Превышен бюджет';
      case 'NO_DEPOSITS': return 'Нет депозитов';
      case 'HIGH_CPA': return 'Высокий CPA';
      case 'LOW_CONVERSION': return 'Низкая конверсия';
      case 'ACCOUNT_ISSUES': return 'Проблемы с аккаунтом';
      case 'COMPLIANCE': return 'Комплаенс';
      case 'PERFORMANCE': return 'Производительность';
      case 'TECHNICAL': return 'Технические проблемы';
      case 'CUSTOM': return 'Прочее';
      default: return type;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ч назад`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} дн назад`;
    }
  };

  return (
    <div className={`border rounded-lg p-6 transition-all hover:shadow-md ${getSeverityColor(signal.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{getSeverityIcon(signal.severity)}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {signal.title}
                </h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {getTypeLabel(signal.type)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {signal.project?.name || 'Общий сигнал'} • {formatTimeAgo(signal.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {signal.description}
            </p>
            
            {signal.metadata && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(JSON.parse(signal.metadata)).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isActive && signal.status === 'ACTIVE' && (
          <div className="flex items-center space-x-2 ml-4">
            <div className="relative">
              <button 
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Отложить"
                onClick={() => onSnooze(signal.id, 4)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            
            <button 
              onClick={() => onResolve(signal.id)}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
            >
              Решено
            </button>
          </div>
        )}

        {!isActive && signal.resolvedAt && (
          <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
            <div>Решено: {new Date(signal.resolvedAt).toLocaleDateString('ru-RU')}</div>
            {signal.resolvedBy && (
              <div>Кем: {signal.resolvedBy}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент настроек сигналов
function SignalSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Настройки алертов
      </h3>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-yellow-800 dark:text-yellow-400 text-sm">
            Настройки алертов управляются Lead Buyer и администраторами
          </p>
        </div>
      </div>
      
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Функция настроек алертов находится в разработке
        </p>
      </div>
    </div>
  );
}

