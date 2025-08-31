"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  Key,
  Globe,
  Settings,
  AlertCircle,
  Info
} from "lucide-react";

interface TokenInfo {
  exists: boolean;
  length: number;
  preview: string;
  isValid: boolean;
}

interface WebSocketInfo {
  connected: boolean;
  status: string;
  state: number;
  url: string;
}

interface SourceAnalysis {
  id: string;
  name: string;
  isActive: boolean;
  project: string;
  token: TokenInfo;
  websocket: WebSocketInfo;
  issues: string[];
}

interface DiagnosticStats {
  total: number;
  active: number;
  withValidTokens: number;
  connected: number;
  connecting: number;
  failed: number;
}

interface Recommendation {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  action: string;
}

interface DiagnosticData {
  stats: DiagnosticStats;
  commonIssues: {
    inactiveSources: number;
    invalidTokens: number;
    connectionProblems: number;
  };
  sources: SourceAnalysis[];
  recommendations: Recommendation[];
}

export default function WebSocketDiagnostics() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deposits/websocket-diagnosis');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const error = await response.json();
        showError('Ошибка', error.error || 'Не удалось загрузить диагностику');
      }
    } catch (error) {
      console.error('Ошибка загрузки диагностики:', error);
      showError('Ошибка', 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string, sourceId?: string) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/deposits/websocket-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, sourceId }),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Действие выполнено', result.message);
        // Обновляем данные через 2 секунды
        setTimeout(loadDiagnostics, 2000);
      } else {
        const error = await response.json();
        showError('Ошибка выполнения', error.error || 'Не удалось выполнить действие');
      }
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
      showError('Ошибка выполнения', 'Произошла ошибка при выполнении действия');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-green-600 dark:text-green-400';
      case 'CONNECTING':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'NOT_CONNECTED':
      case 'CLOSED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Wifi className="w-4 h-4" />;
      case 'CONNECTING':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'NOT_CONNECTED':
      case 'CLOSED':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Не удалось загрузить диагностические данные</p>
          <button
            onClick={loadDiagnostics}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed]">
              Детальная диагностика WebSocket
            </h2>
            <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
              Анализ подключений и выявление проблем
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDiagnostics}
            disabled={loading || actionLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          <button
            onClick={() => performAction('reconnect_all')}
            disabled={actionLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Wifi className="w-4 h-4" />
            Переподключить все
          </button>
          <button
            onClick={() => performAction('sync_sources')}
            disabled={actionLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Синхронизировать
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Всего</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.stats.total}</p>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400">Активных</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.stats.active}</p>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-green-600 dark:text-green-400">Подключено</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.stats.connected}</p>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Подключается</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{data.stats.connecting}</p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">Отключено</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.stats.failed}</p>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-purple-600 dark:text-purple-400">С токенами</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.stats.withValidTokens}</p>
          </div>
        </div>
      </div>

      {/* Рекомендации */}
      {data.recommendations.length > 0 && (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
            Рекомендации
          </h3>
          <div className="space-y-3">
            {data.recommendations.map((rec, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                rec.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
                rec.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                rec.type === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-[#171717] dark:text-[#ededed]">{rec.title}</h4>
                    <p className="text-sm text-[#171717]/70 dark:text-[#ededed]/70 mt-1">{rec.description}</p>
                    <p className="text-sm font-medium text-[#171717]/80 dark:text-[#ededed]/80 mt-2">{rec.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Детальная информация по источникам */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
          Анализ источников депозитов
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#171717]/10 dark:border-[#ededed]/10">
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Источник</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Статус</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Токен</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">WebSocket</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Проблемы</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((source) => (
                <tr key={source.id} className="border-b border-[#171717]/5 dark:border-[#ededed]/5 hover:bg-[#171717]/2 dark:hover:bg-[#ededed]/2">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-[#171717] dark:text-[#ededed]">{source.name}</div>
                      <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">{source.project}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      source.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {source.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {source.token.isValid ? (
                        <Key className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Key className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {source.token.preview}
                      </code>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`flex items-center gap-2 font-medium ${getStatusColor(source.websocket.status)}`}>
                      {getStatusIcon(source.websocket.status)}
                      {source.websocket.status}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {source.issues.length > 0 ? (
                      <div className="space-y-1">
                        {source.issues.map((issue, idx) => (
                          <div key={idx} className="text-xs text-red-600 dark:text-red-400">
                            • {issue}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-green-600 dark:text-green-400">✓ Все в порядке</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {source.isActive && source.issues.length > 0 && (
                      <button
                        onClick={() => performAction('reconnect_source', source.id)}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-2 rounded transition-colors disabled:opacity-50"
                      >
                        Переподключить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
