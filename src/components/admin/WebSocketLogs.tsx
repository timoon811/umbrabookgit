"use client";

import { useState, useEffect } from "react";
import { Trash2, RefreshCw, Download, Search } from "lucide-react";
import { useToast } from "@/components/Toast";

interface WebSocketLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  sourceId?: string;
}

export default function WebSocketLogs() {
  const { showSuccess, showError } = useToast();
  const [logs, setLogs] = useState<WebSocketLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000); // Обновляем каждые 5 секунд
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/deposits/websocket-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs?.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })) || []);
      } else {
        showError('Ошибка загрузки', 'Не удалось загрузить логи WebSocket');
      }
    } catch (error) {
      console.error('Ошибка загрузки логов:', error);
      showError('Ошибка загрузки', 'Произошла ошибка при загрузке логов');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Вы уверены, что хотите очистить все логи WebSocket?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/deposits/websocket-logs', {
        method: 'DELETE'
      });

      if (response.ok) {
        setLogs([]);
        showSuccess('Логи очищены', 'Все логи WebSocket успешно удалены');
      } else {
        showError('Ошибка очистки', 'Не удалось очистить логи');
      }
    } catch (error) {
      console.error('Ошибка очистки логов:', error);
      showError('Ошибка очистки', 'Произошла ошибка при очистке логов');
    }
  };

  const downloadLogs = () => {
    const filteredLogs = getFilteredLogs();
    const logsText = filteredLogs.map(log => 
      `${log.timestamp.toISOString()} [${log.level.toUpperCase()}] ${log.sourceId ? `[${log.sourceId}]` : '[GLOBAL]'} ${log.message}`
    ).join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      // Фильтр по уровню
      if (filterLevel !== 'all' && log.level !== filterLevel) {
        return false;
      }

      // Фильтр по источнику
      if (selectedSourceId !== 'all') {
        if (selectedSourceId === 'global' && log.sourceId) {
          return false;
        }
        if (selectedSourceId !== 'global' && log.sourceId !== selectedSourceId) {
          return false;
        }
      }

      // Поиск по тексту
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
      default:
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
      default:
        return '✅';
    }
  };

  // Получаем уникальные источники для фильтра
  const uniqueSourceIds = Array.from(new Set(logs.map(log => log.sourceId).filter(Boolean)));

  const filteredLogs = getFilteredLogs();

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
      {/* Заголовок и управление */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed]">
            Логи WebSocket
          </h2>
          <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
            Детальные логи работы WebSocket соединений для депозитов
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
              Авто-обновление:
            </label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
          <button
            onClick={downloadLogs}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Скачать
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Очистить
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск по сообщению..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Фильтр по уровню */}
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Все уровни</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>

        {/* Фильтр по источнику */}
        <select
          value={selectedSourceId}
          onChange={(e) => setSelectedSourceId(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Все источники</option>
          <option value="global">Глобальные логи</option>
          {uniqueSourceIds.map(sourceId => (
            <option key={sourceId} value={sourceId}>
              {sourceId}
            </option>
          ))}
        </select>

        {/* Статистика */}
        <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 flex items-center">
          Показано: {filteredLogs.length} из {logs.length}
        </div>
      </div>

      {/* Логи */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
            Логи не найдены
          </h4>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60">
            {logs.length === 0 ? 'Логи WebSocket пока отсутствуют' : 'Нет логов, соответствующих фильтрам'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.slice().reverse().map((log, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getLevelColor(log.level)} border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{getLevelIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {log.timestamp.toLocaleString('ru-RU')}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    {log.sourceId && (
                      <span className="text-xs font-mono bg-gray-100 dark:bg-[#0a0a0a] px-2 py-0.5 rounded">
                        {log.sourceId.slice(-8)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                    {log.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
