import { useState, useCallback } from 'react';
import { SystemNotification } from '@/components/admin/NotificationCenter';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [history, setHistory] = useState<SystemNotification[]>([]); // История всех уведомлений

  const addNotification = useCallback((
    type: SystemNotification['type'],
    title: string,
    message: string,
    source: string,
    options?: {
      autoClose?: boolean;
      closable?: boolean;
      persistent?: boolean;
      actions?: SystemNotification['actions'];
    }
  ) => {
    const notification: SystemNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      source,
      timestamp: new Date(),
      autoClose: options?.autoClose ?? true,
      closable: options?.closable ?? true,
      persistent: options?.persistent ?? true,
      viewed: false,
      actions: options?.actions
    };

    // Проверяем, нет ли уже такого же уведомления в истории за последние 5 минут
    const isDuplicate = history.some(h => 
      h.title === notification.title && 
      h.message === notification.message &&
      h.source === notification.source &&
      (Date.now() - h.timestamp.getTime()) < 5 * 60 * 1000 // 5 минут
    );

    if (isDuplicate) {
      return notification.id; // Не добавляем дубликат
    }

    setNotifications(prev => [notification, ...prev]);
    setHistory(prev => [notification, ...prev]);

    // Автоматическое закрытие через 5 секунд для неошибочных уведомлений
    if (notification.autoClose && type !== 'error') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }

    return notification.id;
  }, [history]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Также удаляем из истории если это не persistent уведомление
    setHistory(prev => prev.map(n => 
      n.id === id && !n.persistent ? { ...n, viewed: true } : n
    ));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsViewed = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, viewed: true } : n
    ));
    setHistory(prev => prev.map(n => 
      n.id === id ? { ...n, viewed: true } : n
    ));
  }, []);

  const markAllAsViewed = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, viewed: true })));
    setHistory(prev => prev.map(n => ({ ...n, viewed: true })));
  }, []);

  // Получить количество непросмотренных уведомлений
  const getUnviewedCount = useCallback(() => {
    return history.filter(n => !n.viewed).length;
  }, [history]);

  // Удобные методы для разных типов уведомлений
  const showSuccess = useCallback((title: string, message: string, source: string, actions?: SystemNotification['actions']) => {
    return addNotification('success', title, message, source, { actions });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, source: string, actions?: SystemNotification['actions']) => {
    return addNotification('error', title, message, source, { autoClose: false, actions });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, source: string, actions?: SystemNotification['actions']) => {
    return addNotification('warning', title, message, source, { actions });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, source: string, actions?: SystemNotification['actions']) => {
    return addNotification('info', title, message, source, { actions });
  }, [addNotification]);

  // Специальные уведомления для системных событий
  const showAuthError = useCallback(() => {
    return showError(
      'Ошибка авторизации',
      'Ваша сессия истекла или недостаточно прав доступа',
      'Система',
      [
        {
          label: 'Войти заново',
          action: () => window.location.href = '/login',
          variant: 'primary'
        }
      ]
    );
  }, [showError]);

  const showNetworkError = useCallback((source: string, retryAction?: () => void) => {
    return showError(
      'Ошибка сети',
      'Проблема с подключением к серверу',
      source,
      retryAction ? [
        {
          label: 'Повторить',
          action: retryAction,
          variant: 'primary'
        }
      ] : undefined
    );
  }, [showError]);

  const showWebSocketIssue = useCallback((status: 'disconnected' | 'connecting' | 'error', sourceName: string) => {
    const messages = {
      disconnected: 'WebSocket соединение прервано',
      connecting: 'Переподключение к WebSocket...',
      error: 'Ошибка WebSocket соединения'
    };

    const type = status === 'connecting' ? 'info' : status === 'disconnected' ? 'warning' : 'error';
    
    return addNotification(
      type,
      'Проблема с соединением',
      messages[status],
      `Депозиты • ${sourceName}`,
      {
        autoClose: status === 'connecting',
        actions: status === 'error' ? [
          {
            label: 'Диагностика',
            action: () => window.location.hash = '#websocket-diagnostics',
            variant: 'primary'
          }
        ] : undefined
      }
    );
  }, [addNotification]);

  const showShiftAlert = useCallback((type: 'missed' | 'late' | 'early_departure', processorName: string, shiftType: string) => {
    const messages = {
      missed: `Пропущена смена "${shiftType}"`,
      late: `Опоздание на смену "${shiftType}"`,
      early_departure: `Ранний уход со смены "${shiftType}"`
    };

    return showWarning(
      'Проблема со сменой',
      `${processorName}: ${messages[type]}`,
      'Смены',
      [
        {
          label: 'Подробности',
          action: () => window.location.hash = '#shift-logs',
          variant: 'primary'
        }
      ]
    );
  }, [showWarning]);

  const showSalaryAlert = useCallback((calculatedAmount: number, requestedAmount: number, processorName: string) => {
    const diff = Math.abs(calculatedAmount - requestedAmount);
    
    return showWarning(
      'Расхождение в ЗП',
      `${processorName}: расчетная сумма отличается на $${diff.toFixed(2)}`,
      'Зарплата',
      [
        {
          label: 'Проверить',
          action: () => window.location.hash = '#salary-requests',
          variant: 'primary'
        }
      ]
    );
  }, [showWarning]);

  return {
    notifications,
    history,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAsViewed,
    markAllAsViewed,
    getUnviewedCount,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAuthError,
    showNetworkError,
    showWebSocketIssue,
    showShiftAlert,
    showSalaryAlert
  };
};
