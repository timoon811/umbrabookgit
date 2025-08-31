"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

interface DiagnosticData {
  summary: {
    totalSources: number;
    activeSources: number;
    connectedSources: number;
    totalDeposits: number;
    gamblerSourceFound: boolean;
  };
  depositSources: Array<{
    id: string;
    name: string;
    isActive: boolean;
    project: string;
    depositsCount: number;
    webSocketStatus: string;
    tokenPreview: string;
  }>;
  recentDeposits: Array<{
    id: string;
    mammothLogin: string;
    amount: number;
    token: string;
    sourceName: string;
    projectName: string;
    createdAt: string;
  }>;
  gamblerSource: {
    id: string;
    name: string;
    isActive: boolean;
    project: string;
    depositsCount: number;
    webSocketStatus: string;
  } | null;
  disconnectedSources: Array<{
    id: string;
    name: string;
    project: string;
  }>;
}

export default function DepositsDebugPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deposits/debug');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        showError('Ошибка загрузки', 'Не удалось получить диагностические данные');
      }
    } catch (error) {
      console.error('Ошибка загрузки диагностики:', error);
      showError('Ошибка загрузки', 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/deposits/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Действие выполнено', result.message);
        // Обновляем данные через 2 секунды
        setTimeout(fetchDiagnostics, 2000);
      } else {
        const errorData = await response.json();
        showError('Ошибка выполнения', errorData.error || 'Не удалось выполнить действие');
      }
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
      showError('Ошибка выполнения', 'Произошла ошибка при выполнении действия');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Не удалось загрузить диагностические данные</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Диагностика депозитов
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Мониторинг и диагностика системы приема депозитов
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('sync')}
            disabled={actionLoading}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            Синхронизировать
          </button>
          <button
            onClick={() => handleAction('reconnect')}
            disabled={actionLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Wifi className="w-4 h-4" />
            Переподключить
          </button>
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Всего источников</p>
              <p className="text-xl font-bold text-[#171717] dark:text-[#ededed]">{data.summary.totalSources}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Активных</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{data.summary.activeSources}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Подключено</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.summary.connectedSources}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Всего депозитов</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{data.summary.totalDeposits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.summary.gamblerSourceFound ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {data.summary.gamblerSourceFound ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Gambler найден</p>
              <p className={`text-xl font-bold ${data.summary.gamblerSourceFound ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.summary.gamblerSourceFound ? 'Да' : 'Нет'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gambler Source */}
      {data.gamblerSource && (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-4 flex items-center gap-2">
            🎯 Источник Gambler timoon811
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Статус</p>
              <p className={`font-medium ${data.gamblerSource.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.gamblerSource.isActive ? '✅ Активен' : '❌ Неактивен'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Проект</p>
              <p className="font-medium text-[#171717] dark:text-[#ededed]">{data.gamblerSource.project}</p>
            </div>
            <div>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">Депозитов</p>
              <p className="font-medium text-[#171717] dark:text-[#ededed]">{data.gamblerSource.depositsCount}</p>
            </div>
            <div>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">WebSocket</p>
              <div className={`flex items-center gap-2 font-medium ${getStatusColor(data.gamblerSource.webSocketStatus)}`}>
                {getStatusIcon(data.gamblerSource.webSocketStatus)}
                {data.gamblerSource.webSocketStatus}
              </div>
            </div>
            <div>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">ID</p>
              <p className="font-mono text-sm text-[#171717] dark:text-[#ededed]">{data.gamblerSource.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Источники депозитов */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-4">
          Источники депозитов
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#171717]/10 dark:border-[#ededed]/10">
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Название</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Проект</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Статус</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">WebSocket</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Депозитов</th>
                <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Токен</th>
              </tr>
            </thead>
            <tbody>
              {data.depositSources.map((source) => (
                <tr key={source.id} className="border-b border-[#171717]/5 dark:border-[#ededed]/5 hover:bg-[#171717]/2 dark:hover:bg-[#ededed]/2">
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#171717] dark:text-[#ededed]">{source.name}</div>
                    <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 font-mono">{source.id}</div>
                  </td>
                  <td className="py-3 px-4 text-[#171717] dark:text-[#ededed]">{source.project}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      source.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {source.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`flex items-center gap-2 font-medium ${getStatusColor(source.webSocketStatus)}`}>
                      {getStatusIcon(source.webSocketStatus)}
                      {source.webSocketStatus}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#171717] dark:text-[#ededed]">{source.depositsCount}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{source.tokenPreview}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Последние депозиты */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-4">
          Последние депозиты
        </h2>
        {data.recentDeposits.length === 0 ? (
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 text-center py-8">Депозиты не найдены</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#171717]/10 dark:border-[#ededed]/10">
                  <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Мамонт</th>
                  <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Сумма</th>
                  <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Источник</th>
                  <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Проект</th>
                  <th className="text-left py-3 px-4 font-medium text-[#171717]/70 dark:text-[#ededed]/70">Дата</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDeposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-[#171717]/5 dark:border-[#ededed]/5 hover:bg-[#171717]/2 dark:hover:bg-[#ededed]/2">
                    <td className="py-3 px-4">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{deposit.id.slice(-8)}</code>
                    </td>
                    <td className="py-3 px-4 text-[#171717] dark:text-[#ededed]">{deposit.mammothLogin}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#171717] dark:text-[#ededed]">{deposit.amount} {deposit.token.toUpperCase()}</span>
                    </td>
                    <td className="py-3 px-4 text-[#171717] dark:text-[#ededed]">{deposit.sourceName}</td>
                    <td className="py-3 px-4 text-[#171717] dark:text-[#ededed]">{deposit.projectName}</td>
                    <td className="py-3 px-4 text-[#171717]/60 dark:text-[#ededed]/60">
                      {new Date(deposit.createdAt).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Отключенные источники */}
      {data.disconnectedSources.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Активные источники БЕЗ WebSocket подключения
          </h2>
          <div className="space-y-2">
            {data.disconnectedSources.map((source) => (
              <div key={source.id} className="flex items-center gap-4 bg-white dark:bg-red-900/40 rounded-lg p-3">
                <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">{source.name}</p>
                  <p className="text-sm text-red-600 dark:text-red-300">Проект: {source.project}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
