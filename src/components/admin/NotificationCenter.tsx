"use client";

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export interface SystemNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  source: string; // Таб или компонент источник
  timestamp: Date;
  autoClose?: boolean;
  closable?: boolean;
  viewed?: boolean; // Новое поле для отслеживания просмотра
  persistent?: boolean; // Сохранять в истории после закрытия
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onClose: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({ 
  notifications, 
  onClose, 
  onClearAll 
}: NotificationCenterProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(notifications.length > 0);
  }, [notifications]);

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = (type: SystemNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          header: 'text-green-800 dark:text-green-200',
          text: 'text-green-700 dark:text-green-300'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          header: 'text-yellow-800 dark:text-yellow-200',
          text: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          header: 'text-red-800 dark:text-red-200',
          text: 'text-red-700 dark:text-red-300'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          header: 'text-blue-800 dark:text-blue-200',
          text: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full space-y-3">
      {/* Заголовок с кнопкой "Закрыть все" */}
      {notifications.length > 1 && (
        <div className="flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Уведомления ({notifications.length})
          </span>
          <button
            onClick={onClearAll}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:underline transition-colors"
          >
            Закрыть все
          </button>
        </div>
      )}

      {/* Список уведомлений */}
      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        {notifications.map((notification) => {
          const colors = getColors(notification.type);
          
          return (
            <div
              key={notification.id}
              className={`
                ${colors.bg} border rounded-lg shadow-lg p-4 
                transform transition-all duration-300 ease-in-out
                hover:shadow-xl
              `}
            >
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm ${colors.header}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${colors.text}`}>
                        {notification.message}
                      </p>
                      
                      {/* Мета-информация */}
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                        <span className={colors.text}>
                          {notification.source}
                        </span>
                        <span className={colors.text}>•</span>
                        <span className={colors.text}>
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Кнопка закрытия */}
                    {(notification.closable !== false) && (
                      <button
                        onClick={() => onClose(notification.id)}
                        className={`
                          p-1 rounded-md transition-colors
                          ${colors.text} hover:opacity-80
                        `}
                        aria-label="Закрыть уведомление"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Действия */}
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className={`
                            px-3 py-1 text-xs font-medium rounded-md transition-colors
                            ${action.variant === 'primary' 
                              ? `${colors.header} bg-white/20 hover:bg-white/30` 
                              : `${colors.text} bg-white/10 hover:bg-white/20`
                            }
                          `}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
