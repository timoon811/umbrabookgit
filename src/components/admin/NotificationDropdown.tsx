"use client";

import React, { useState, useRef, useEffect } from 'react';
import { SystemNotification } from './NotificationCenter';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Clock, Trash2 } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: SystemNotification[];
  onMarkAsViewed: (id: string) => void;
  onClose: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function NotificationDropdown({
  notifications,
  onMarkAsViewed,
  onClose,
  onClearAll,
  isOpen,
  onToggle
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedTab, setSelectedTab] = useState<'recent' | 'all'>('recent');

  // Закрытие при клике вне dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  // Автоматически отмечаем как просмотренные при открытии dropdown
  useEffect(() => {
    if (isOpen) {
      const unviewedIds = notifications
        .filter(n => !n.viewed)
        .map(n => n.id);
      
      unviewedIds.forEach(id => onMarkAsViewed(id));
    }
  }, [isOpen, notifications, onMarkAsViewed]);

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}д назад`;
    if (hours > 0) return `${hours}ч назад`;
    if (minutes > 0) return `${minutes}м назад`;
    return 'Только что';
  };

  const recentNotifications = notifications.slice(0, 10);
  const displayNotifications = selectedTab === 'recent' ? recentNotifications : notifications;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[9999] backdrop-blur-sm"
      style={{ 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
      }}
    >
      {/* Заголовок */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Уведомления
          </h3>
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Очистить все
            </button>
          )}
        </div>

        {/* Табы */}
        <div className="flex mt-2 space-x-1">
          <button
            onClick={() => setSelectedTab('recent')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedTab === 'recent'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Последние
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedTab === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Все ({notifications.length})
          </button>
        </div>
      </div>

      {/* Список уведомлений */}
      <div className="max-h-96 overflow-y-auto">
        {displayNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <CheckCircle className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Нет уведомлений
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                  !notification.viewed ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{notification.source}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.timestamp)}
                          </div>
                          {!notification.viewed && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                Новое
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {notification.closable !== false && (
                        <button
                          onClick={() => onClose(notification.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                          aria-label="Удалить уведомление"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    {/* Действия */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              action.action();
                              onToggle(); // Закрываем dropdown после действия
                            }}
                            className={`
                              px-2 py-1 text-xs font-medium rounded transition-colors
                              ${action.variant === 'primary'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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
            ))}
          </div>
        )}
      </div>

      {/* Футер */}
      {displayNotifications.length > 0 && selectedTab === 'recent' && notifications.length > 10 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab('all')}
            className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-center"
          >
            Показать все уведомления ({notifications.length})
          </button>
        </div>
      )}
    </div>
  );
}
