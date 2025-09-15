"use client";

import React from 'react';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { Bell, AlertTriangle, CheckCircle, Info, Wifi } from 'lucide-react';

export default function NotificationDemo() {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    showAuthError,
    showNetworkError,
    showWebSocketIssue,
    showShiftAlert,
    showSalaryAlert 
  } = useNotificationContext();

  const demoNotifications = [
    {
      label: 'Успешное сохранение',
      icon: <CheckCircle className="w-4 h-4" />,
      action: () => showSuccess('Настройки сохранены', `Все изменения успешно применены ${new Date().getSeconds()}с`, 'ЗП'),
      color: 'bg-green-100 text-green-800 hover:bg-green-200'
    },
    {
      label: 'Ошибка сети',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-red-100 text-red-800 hover:bg-red-200'
    },
    {
      label: 'Предупреждение',
      icon: <Info className="w-4 h-4" />,
      action: () => showWarning('Внимание', 'Обнаружены расхождения в данных', 'Депозиты'),
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    },
    {
      label: 'Информация',
      icon: <Info className="w-4 h-4" />,
      action: () => showInfo('Новые данные', 'Загружены последние обновления', 'Смены'),
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    },
    {
      label: 'Ошибка авторизации',
      icon: <AlertTriangle className="w-4 h-4" />,
      action: () => showAuthError(),
      color: 'bg-red-100 text-red-800 hover:bg-red-200'
    },
    {
      label: 'WebSocket отключен',
      icon: <Wifi className="w-4 h-4" />,
      action: () => showWebSocketIssue('disconnected', 'Mammoth API'),
      color: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    },
    {
      label: 'Пропущена смена',
      icon: <AlertTriangle className="w-4 h-4" />,
      action: () => showShiftAlert('missed', 'Иван Петров', 'УТРЕННЯЯ'),
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    },
    {
      label: 'Расхождение в ЗП',
      icon: <AlertTriangle className="w-4 h-4" />,
      action: () => showSalaryAlert(1250, 1500, 'Мария Сидорова'),
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Демонстрация уведомлений
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Кликните на кнопки ниже для тестирования различных типов уведомлений
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {demoNotifications.map((notification, index) => (
          <button
            key={index}
            onClick={notification.action}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200
              ${notification.color}
              border-current border-opacity-20 
              hover:scale-105 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            `}
          >
            {notification.icon}
            <span className="text-sm font-medium">{notification.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          💡 Как работают уведомления:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• 🔔 <strong>Иконка уведомлений</strong> в header с бэджем количества</li>
          <li>• 📱 <strong>Dropdown панель</strong> с историей всех уведомлений</li>
          <li>• ⏰ Автоматически закрываются через 5 секунд (кроме ошибок)</li>
          <li>• 👁️ Автоматически отмечаются как просмотренные</li>
          <li>• 🚫 Не показывают дубликаты в течение 5 минут</li>
          <li>• 🎯 Поддерживают действия для быстрого реагирования</li>
        </ul>
      </div>
    </div>
  );
}
