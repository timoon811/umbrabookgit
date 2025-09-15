"use client";

import { BuyerSignal } from "@/types/buyer";

interface BuyerSignalsListProps {
  signals: BuyerSignal[];
  compact?: boolean;
}

export default function BuyerSignalsList({ signals, compact = false }: BuyerSignalsListProps) {
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
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'Критический';
      case 'HIGH': return 'Высокий';
      case 'MEDIUM': return 'Средний';
      case 'LOW': return 'Низкий';
      default: return severity;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ROAS_DROP': return 'Падение ROAS';
      case 'ANOMALY': return 'Аномалия';
      case 'MISSING_LOG': return 'Пропущен дневник';
      case 'OVERSPEND': return 'Превышение трат';
      case 'CUSTOM': return 'Прочее';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'IN_PROGRESS':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'RESOLVED':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'DISMISSED':
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Активный';
      case 'IN_PROGRESS': return 'В работе';
      case 'RESOLVED': return 'Решен';
      case 'DISMISSED': return 'Отклонен';
      default: return status;
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {signals.slice(0, 3).map((signal) => (
          <div key={signal.id} className={`p-3 rounded-lg border-l-4 ${getSeverityColor(signal.severity)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">
                    {getTypeLabel(signal.type)}
                  </span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">
                    {getSeverityLabel(signal.severity)}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {signal.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {signal.description.length > 80 
                    ? `${signal.description.substring(0, 80)}...` 
                    : signal.description
                  }
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(signal.status)}`}>
                {getStatusLabel(signal.status)}
              </span>
            </div>
          </div>
        ))}
        
        {signals.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Активных сигналов нет</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Сигналы и алерты
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Уведомления о важных событиях в ваших проектах
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Всего активных: <span className="font-medium">{signals.filter(s => s.status === 'ACTIVE').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        {signals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12H4l5-5v5zM15 7h5l-5-5v5zM9 17H4l5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Сигналов нет
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              У вас нет активных сигналов. Система уведомит вас о важных событиях.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {signals.map((signal) => (
              <div key={signal.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`p-4 rounded-lg border-l-4 ${getSeverityColor(signal.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium">
                          {getTypeLabel(signal.type)}
                        </span>
                        <span className="text-sm">•</span>
                        <span className="text-sm">
                          {getSeverityLabel(signal.severity)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(signal.status)}`}>
                          {getStatusLabel(signal.status)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {signal.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {signal.description}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        {signal.project && (
                          <div className="flex items-center space-x-1">
                            <span>Проект:</span>
                            <span className="font-medium">{signal.project.name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <span>Создан:</span>
                          <span className="font-medium">
                            {new Date(signal.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {signal.resolvedAt && (
                          <div className="flex items-center space-x-1">
                            <span>Решен:</span>
                            <span className="font-medium">
                              {new Date(signal.resolvedAt).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {signal.adminComment && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="text-xs font-medium text-blue-800 dark:text-blue-400">Комментарий админа:</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">{signal.adminComment}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {signal.status === 'ACTIVE' && (
                        <button className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                          В работу
                        </button>
                      )}
                      {signal.status === 'IN_PROGRESS' && (
                        <button className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                          Решить
                        </button>
                      )}
                      <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

